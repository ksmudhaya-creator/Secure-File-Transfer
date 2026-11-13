const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const File = require('../models/File');
const TransferSession = require('../models/TransferSession');
const TransferFSM = require('../stateMachine/transferFSM');
const { STATES } = require('../stateMachine/fsmConfig');
const {
  calculateFileSHA256,
  encryptFileToDisk,
  decryptBuffer,
} = require('../utils/cryptoUtils');
const { logSecurityEvent, getClientIp } = require('../middleware/securityLogger');

const uploadsDir = path.join(__dirname, '..', 'uploads', 'encrypted');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * @desc    Upload & encrypt file with FSM state integration
 * @route   POST /api/files/upload
 * @access  Private
 */
const uploadFile = async (req, res, next) => {
  let session = null;
  const ipAddress = getClientIp(req);
  let tempFilePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded.',
      });
    }

    tempFilePath = req.file.path;
    const { originalname, size, mimetype } = req.file;
    const clientSessionId = req.body.sessionId;

    // Locate or create transfer session
    if (clientSessionId) {
      session = await TransferSession.findOne({
        sessionId: clientSessionId,
        userId: req.user._id,
      });
    }

    if (!session) {
      const timeoutMinutes = parseInt(process.env.SESSION_TIMEOUT_MINUTES || '30', 10);
      const expiresAt = new Date(Date.now() + timeoutMinutes * 60 * 1000);
      session = await TransferSession.create({
        sessionId: clientSessionId || uuidv4(),
        userId: req.user._id,
        fileName: originalname,
        fileSize: size,
        transferType: 'UPLOAD',
        currentState: STATES.INITIATED,
        transferProgress: 10,
        expiresAt,
        stateHistory: [
          {
            fromState: 'NONE',
            toState: STATES.INITIATED,
            timestamp: new Date(),
            reason: 'Session initiated for file upload.',
            progress: 10,
          },
        ],
      });
    }

    // Step 1: Transition INITIATED -> AUTHENTICATING
    if (session.currentState === STATES.INITIATED) {
      await TransferFSM.transition(session, STATES.AUTHENTICATING, {
        reason: 'Verifying authenticated user identity and authorization credentials.',
        progress: 25,
        userId: req.user._id,
        ipAddress,
      });
    }

    // Step 2: Transition AUTHENTICATING -> READY
    if (session.currentState === STATES.AUTHENTICATING) {
      await TransferFSM.transition(session, STATES.READY, {
        reason: 'Client storage channel opened; preparing for cryptographic stream.',
        progress: 40,
        userId: req.user._id,
        ipAddress,
      });
    }

    // Step 3: Transition READY -> UPLOADING
    if (session.currentState === STATES.READY) {
      await TransferFSM.transition(session, STATES.UPLOADING, {
        reason: 'Receiving multipart payload and writing to temporary staging buffer.',
        progress: 65,
        userId: req.user._id,
        ipAddress,
      });
    }

    // Step 4: Transition UPLOADING -> VERIFYING
    if (session.currentState === STATES.UPLOADING) {
      await TransferFSM.transition(session, STATES.VERIFYING, {
        reason: 'Computing SHA-256 integrity hash and applying AES-256-GCM authenticated cipher.',
        progress: 85,
        userId: req.user._id,
        ipAddress,
      });
    }

    // Compute original SHA-256 hash and encrypt to disk with AES-256-GCM
    const encryptedFileName = `enc-${uuidv4()}.dat`;
    const encryptedDestination = path.join(uploadsDir, encryptedFileName);

    const { iv, authTag, fileHash } = await encryptFileToDisk(tempFilePath, encryptedDestination);

    // Save File record to database
    const fileDoc = await File.create({
      owner: req.user._id,
      fileName: originalname,
      originalName: originalname,
      mimeType: mimetype,
      fileSize: size,
      encryptedFilePath: encryptedDestination,
      fileHash,
      iv,
      authTag,
    });

    // Clean up temporary plaintext upload file
    if (fs.existsSync(tempFilePath)) {
      await fs.promises.unlink(tempFilePath);
      tempFilePath = null;
    }

    // Attach file to session and transition VERIFYING -> COMPLETED
    session.fileId = fileDoc._id;
    session.fileName = originalname;
    session.fileSize = size;

    await TransferFSM.transition(session, STATES.COMPLETED, {
      reason: `File '${originalname}' encrypted with AES-256-GCM and SHA-256 hash (${fileHash.slice(0, 16)}...) verified.`,
      progress: 100,
      userId: req.user._id,
      ipAddress,
    });

    await logSecurityEvent({
      userId: req.user._id,
      activity: 'FILE_UPLOADED_ENCRYPTED',
      ipAddress,
      status: 'SUCCESS',
      details: {
        fileId: fileDoc._id,
        fileName: fileDoc.fileName,
        size: fileDoc.fileSize,
        sha256Hash: fileDoc.fileHash,
        cipher: 'AES-256-GCM',
      },
    });

    res.status(201).json({
      success: true,
      message: 'File encrypted and stored successfully with verified integrity.',
      file: {
        id: fileDoc._id,
        fileName: fileDoc.fileName,
        fileSize: fileDoc.fileSize,
        mimeType: fileDoc.mimeType,
        fileHash: fileDoc.fileHash,
        createdAt: fileDoc.createdAt,
      },
      session: {
        sessionId: session.sessionId,
        currentState: session.currentState,
        progress: session.transferProgress,
        history: session.stateHistory,
      },
    });
  } catch (error) {
    // If temp file remains, remove it
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        await fs.promises.unlink(tempFilePath);
      } catch (cleanupErr) {
        console.error('[FILE] Error cleaning temp file:', cleanupErr.message);
      }
    }

    // Fail session if active
    if (session && !['COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED'].includes(session.currentState)) {
      try {
        await TransferFSM.transition(session, STATES.FAILED, {
          reason: `Upload aborted due to error: ${error.message}`,
          progress: 0,
          userId: req.user._id,
          ipAddress,
        });
      } catch (fsmErr) {
        console.error('[FSM] Failed to transition to FAILED:', fsmErr.message);
      }
    }

    next(error);
  }
};

/**
 * @desc    Get all files owned by current user (or all files if admin)
 * @route   GET /api/files
 * @access  Private
 */
const getFiles = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin' ? {} : { owner: req.user._id };
    const files = await File.find(query)
      .populate('owner', 'username email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: files.length,
      files,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Download and decrypt file with SHA-256 integrity verification
 * @route   GET /api/files/:id/download
 * @access  Private
 */
const downloadFile = async (req, res, next) => {
  const ipAddress = getClientIp(req);

  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      await logSecurityEvent({
        userId: req.user._id,
        activity: 'DOWNLOAD_NOT_FOUND',
        ipAddress,
        status: 'WARNING',
        details: { requestedFileId: req.params.id },
      });
      return res.status(404).json({
        success: false,
        message: 'Requested file not found.',
      });
    }

    // Check ownership or admin privilege
    const isOwner = file.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      await logSecurityEvent({
        userId: req.user._id,
        activity: 'UNAUTHORIZED_FILE_ACCESS_ATTEMPT',
        ipAddress,
        status: 'ALERT',
        details: {
          fileId: file._id,
          fileName: file.fileName,
          fileOwner: file.owner,
        },
      });
      return res.status(403).json({
        success: false,
        message: 'Security Alert: You do not possess authorization permissions to access this encrypted asset.',
      });
    }

    // Check if encrypted file exists on disk
    if (!fs.existsSync(file.encryptedFilePath)) {
      return res.status(404).json({
        success: false,
        message: 'Encrypted storage asset is missing on disk storage.',
      });
    }

    // Read ciphertext and decrypt with stored IV, Auth Tag and verify SHA-256
    const encryptedBuffer = await fs.promises.readFile(file.encryptedFilePath);
    let decryptedData;

    try {
      decryptedData = decryptBuffer(encryptedBuffer, file.iv, file.authTag, file.fileHash);
    } catch (cryptoErr) {
      await logSecurityEvent({
        userId: req.user._id,
        activity: 'INTEGRITY_VERIFICATION_FAILED',
        ipAddress,
        status: 'ALERT',
        details: {
          fileId: file._id,
          fileName: file.fileName,
          error: cryptoErr.message,
        },
      });
      return res.status(400).json({
        success: false,
        message: `Cryptographic Integrity Alert: ${cryptoErr.message}`,
      });
    }

    // Increment download count
    file.downloadCount += 1;
    await file.save();

    await logSecurityEvent({
      userId: req.user._id,
      activity: 'FILE_DOWNLOADED_DECRYPTED',
      ipAddress,
      status: 'SUCCESS',
      details: {
        fileId: file._id,
        fileName: file.fileName,
        verifiedHash: decryptedData.actualHash,
      },
    });

    // Set headers and send verified plaintext file
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(file.fileName)}"`
    );
    res.setHeader('Content-Length', decryptedData.decryptedBuffer.length);
    res.setHeader('X-File-SHA256', file.fileHash);
    res.setHeader('X-Decryption-Status', 'VERIFIED_AES_256_GCM');

    return res.send(decryptedData.decryptedBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify file integrity without downloading
 * @route   GET /api/files/:id/verify
 * @access  Private
 */
const verifyFileIntegrity = async (req, res, next) => {
  const ipAddress = getClientIp(req);

  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    const isOwner = file.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    if (!fs.existsSync(file.encryptedFilePath)) {
      return res.status(404).json({ success: false, message: 'Encrypted payload missing on disk.' });
    }

    const encryptedBuffer = await fs.promises.readFile(file.encryptedFilePath);
    const { hashVerified, actualHash } = decryptBuffer(
      encryptedBuffer,
      file.iv,
      file.authTag,
      file.fileHash
    );

    await logSecurityEvent({
      userId: req.user._id,
      activity: 'FILE_INTEGRITY_CHECKED',
      ipAddress,
      status: 'SUCCESS',
      details: {
        fileId: file._id,
        fileName: file.fileName,
        hashMatches: hashVerified,
        sha256: actualHash,
      },
    });

    res.json({
      success: true,
      verified: hashVerified,
      expectedHash: file.fileHash,
      computedHash: actualHash,
      cipher: 'AES-256-GCM',
      timestamp: new Date(),
    });
  } catch (error) {
    await logSecurityEvent({
      userId: req.user._id,
      activity: 'INTEGRITY_VERIFICATION_FAILED',
      ipAddress,
      status: 'ALERT',
      details: { fileId: req.params.id, error: error.message },
    });
    res.status(400).json({
      success: false,
      verified: false,
      message: `Integrity check failed: ${error.message}`,
    });
  }
};

/**
 * @desc    Delete a file and its encrypted payload
 * @route   DELETE /api/files/:id
 * @access  Private
 */
const deleteFile = async (req, res, next) => {
  const ipAddress = getClientIp(req);

  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ success: false, message: 'File not found.' });
    }

    const isOwner = file.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this file.' });
    }

    // Delete encrypted payload on disk
    if (fs.existsSync(file.encryptedFilePath)) {
      await fs.promises.unlink(file.encryptedFilePath);
    }

    await File.findByIdAndDelete(file._id);

    await logSecurityEvent({
      userId: req.user._id,
      activity: 'FILE_DELETED',
      ipAddress,
      status: 'SUCCESS',
      details: { fileId: file._id, fileName: file.fileName },
    });

    res.json({
      success: true,
      message: 'Encrypted file and metadata deleted securely.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadFile,
  getFiles,
  downloadFile,
  verifyFileIntegrity,
  deleteFile,
};
