const { v4: uuidv4 } = require('uuid');
const TransferSession = require('../models/TransferSession');
const File = require('../models/File');
const TransferFSM = require('../stateMachine/transferFSM');
const { STATES, STATE_METADATA } = require('../stateMachine/fsmConfig');
const { checkAndExpireSingleSession } = require('../services/sessionExpirationService');
const { logSecurityEvent, getClientIp } = require('../middleware/securityLogger');

/**
 * @desc    Create a new transfer session
 * @route   POST /api/sessions/create
 * @access  Private
 */
const createSession = async (req, res, next) => {
  try {
    const { fileName = 'Pending File', fileSize = 0, transferType = 'UPLOAD' } = req.body;
    const ipAddress = getClientIp(req);

    const timeoutMinutes = parseInt(process.env.SESSION_TIMEOUT_MINUTES || '30', 10);
    const expiresAt = new Date(Date.now() + timeoutMinutes * 60 * 1000);
    const sessionId = `SES-${uuidv4().slice(0, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const session = await TransferSession.create({
      sessionId,
      userId: req.user._id,
      fileName,
      fileSize,
      transferType,
      currentState: STATES.INITIATED,
      transferProgress: 10,
      expiresAt,
      stateHistory: [
        {
          fromState: 'INITIAL',
          toState: STATES.INITIATED,
          timestamp: new Date(),
          reason: 'Handshake initiated; transfer session created.',
          progress: 10,
        },
      ],
    });

    await logSecurityEvent({
      userId: req.user._id,
      activity: 'SESSION_CREATED',
      ipAddress,
      status: 'SUCCESS',
      details: {
        sessionId: session.sessionId,
        transferType: session.transferType,
        fileName: session.fileName,
      },
    });

    res.status(201).json({
      success: true,
      session,
      availableTransitions: TransferFSM.getAvailableTransitions(session.currentState),
      metadata: STATE_METADATA[session.currentState],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all transfer sessions for current user (or all if admin)
 * @route   GET /api/sessions
 * @access  Private
 */
const getSessions = async (req, res, next) => {
  try {
    const { state, search } = req.query;
    const query = req.user.role === 'admin' ? {} : { userId: req.user._id };

    if (state && STATES[state]) {
      query.currentState = state;
    }

    if (search) {
      query.$or = [
        { sessionId: { $regex: search, $options: 'i' } },
        { fileName: { $regex: search, $options: 'i' } },
      ];
    }

    const sessions = await TransferSession.find(query)
      .populate('userId', 'username email')
      .populate('fileId', 'fileName fileSize fileHash')
      .sort({ createdAt: -1 });

    // Check expiration on-the-fly for any active sessions
    const updatedSessions = await Promise.all(
      sessions.map(async (sess) => {
        return await checkAndExpireSingleSession(sess);
      })
    );

    res.json({
      success: true,
      count: updatedSessions.length,
      sessions: updatedSessions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single transfer session by ID or sessionId
 * @route   GET /api/sessions/:id
 * @access  Private
 */
const getSessionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let session = await TransferSession.findOne({
      $or: [{ sessionId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    })
      .populate('userId', 'username email')
      .populate('fileId');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Transfer session not found.',
      });
    }

    // Check authorization: user or admin
    if (session.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this transfer session.',
      });
    }

    // Evaluate expiration
    session = await checkAndExpireSingleSession(session);

    res.json({
      success: true,
      session,
      availableTransitions: TransferFSM.getAvailableTransitions(session.currentState),
      metadata: STATE_METADATA[session.currentState],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update session state via FSM
 * @route   PATCH /api/sessions/:id/state
 * @access  Private
 */
const updateSessionState = async (req, res, next) => {
  const ipAddress = getClientIp(req);

  try {
    const { id } = req.params;
    const { targetState, reason, progress } = req.body;

    if (!targetState) {
      return res.status(400).json({
        success: false,
        message: 'targetState parameter is required.',
      });
    }

    let session = await TransferSession.findOne({
      $or: [{ sessionId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Transfer session not found.',
      });
    }

    if (session.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to alter this session state.',
      });
    }

    // Check expiration before state transition
    session = await checkAndExpireSingleSession(session);
    if (session.currentState === STATES.EXPIRED) {
      return res.status(400).json({
        success: false,
        message: 'Cannot transition state: session has already expired.',
      });
    }

    // Execute state transition through FSM
    await TransferFSM.transition(session, targetState, {
      reason: reason || `Manual transition requested by user ${req.user.username}`,
      progress,
      userId: req.user._id,
      ipAddress,
    });

    res.json({
      success: true,
      message: `Session state transitioned to ${targetState}`,
      session,
      availableTransitions: TransferFSM.getAvailableTransitions(session.currentState),
      metadata: STATE_METADATA[session.currentState],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel an active transfer session
 * @route   POST /api/sessions/:id/cancel
 * @access  Private
 */
const cancelSession = async (req, res, next) => {
  const ipAddress = getClientIp(req);

  try {
    const { id } = req.params;
    const { reason = 'Transfer cancelled by user.' } = req.body;

    let session = await TransferSession.findOne({
      $or: [{ sessionId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Transfer session not found.',
      });
    }

    if (session.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to cancel this session.',
      });
    }

    // Cancel session via FSM
    await TransferFSM.transition(session, STATES.CANCELLED, {
      reason,
      progress: 0,
      userId: req.user._id,
      ipAddress,
    });

    res.json({
      success: true,
      message: 'Transfer session successfully cancelled.',
      session,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dashboard statistics for current user (or system-wide for admin)
 * @route   GET /api/sessions/stats
 * @access  Private
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const isUserAdmin = req.user.role === 'admin';
    const fileFilter = isUserAdmin ? {} : { owner: req.user._id };
    const sessionFilter = isUserAdmin ? {} : { userId: req.user._id };

    const totalFiles = await File.countDocuments(fileFilter);
    const totalSessions = await TransferSession.countDocuments(sessionFilter);

    const activeSessions = await TransferSession.countDocuments({
      ...sessionFilter,
      currentState: {
        $in: [
          STATES.INITIATED,
          STATES.AUTHENTICATING,
          STATES.READY,
          STATES.UPLOADING,
          STATES.VERIFYING,
        ],
      },
    });

    const completedTransfers = await TransferSession.countDocuments({
      ...sessionFilter,
      currentState: STATES.COMPLETED,
    });

    const failedTransfers = await TransferSession.countDocuments({
      ...sessionFilter,
      currentState: STATES.FAILED,
    });

    const cancelledTransfers = await TransferSession.countDocuments({
      ...sessionFilter,
      currentState: STATES.CANCELLED,
    });

    const expiredSessions = await TransferSession.countDocuments({
      ...sessionFilter,
      currentState: STATES.EXPIRED,
    });

    // Calculate total bytes transferred
    const files = await File.find(fileFilter).select('fileSize');
    const totalBytes = files.reduce((acc, f) => acc + (f.fileSize || 0), 0);

    // Distribution by FSM state for charts
    const stateDistribution = [
      { name: 'Completed', value: completedTransfers, color: '#10B981' },
      { name: 'Active', value: activeSessions, color: '#3B82F6' },
      { name: 'Failed', value: failedTransfers, color: '#EF4444' },
      { name: 'Cancelled', value: cancelledTransfers, color: '#F59E0B' },
      { name: 'Expired', value: expiredSessions, color: '#6B7280' },
    ];

    // Recent 5 sessions
    const recentSessions = await TransferSession.find(sessionFilter)
      .populate('userId', 'username')
      .sort({ updatedAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        totalFiles,
        totalSessions,
        activeSessions,
        completedTransfers,
        failedTransfers,
        cancelledTransfers,
        expiredSessions,
        totalBytes,
      },
      stateDistribution,
      recentSessions,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSession,
  getSessions,
  getSessionById,
  updateSessionState,
  cancelSession,
  getDashboardStats,
};
