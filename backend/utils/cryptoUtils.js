const crypto = require('crypto');
const fs = require('fs');

// Ensure encryption key is 32 bytes (256 bits)
const getEncryptionKey = () => {
  const envKey = process.env.FILE_ENCRYPTION_KEY;
  if (!envKey) {
    throw new Error('FILE_ENCRYPTION_KEY environment variable is not defined.');
  }

  // If hex string of 64 chars, parse as buffer
  if (envKey.length === 64 && /^[0-9a-fA-F]+$/.test(envKey)) {
    return Buffer.from(envKey, 'hex');
  }

  // Fallback: derive 32-byte key using SHA-256
  return crypto.createHash('sha256').update(envKey).digest();
};

/**
 * Computes SHA-256 hash of a buffer
 * @param {Buffer} buffer
 * @returns {string} Hexadecimal hash
 */
const calculateSHA256 = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

/**
 * Computes SHA-256 hash of a file on disk via streaming
 * @param {string} filePath
 * @returns {Promise<string>}
 */
const calculateFileSHA256 = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (err) => reject(err));
  });
};

/**
 * Encrypts a buffer using AES-256-GCM
 * @param {Buffer} buffer - Plaintext buffer
 * @returns {{ encryptedBuffer: Buffer, iv: string, authTag: string, fileHash: string, originalSize: number }}
 */
const encryptBuffer = (buffer) => {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16); // 128-bit IV for AES-GCM
  const fileHash = calculateSHA256(buffer);
  
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encryptedBuffer = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedBuffer,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    fileHash,
    originalSize: buffer.length,
  };
};

/**
 * Decrypts an encrypted buffer using AES-256-GCM and verifies SHA-256 integrity
 * @param {Buffer} encryptedBuffer
 * @param {string} ivHex
 * @param {string} authTagHex
 * @param {string} expectedHash - Expected original file SHA-256 hash
 * @returns {{ decryptedBuffer: Buffer, hashVerified: boolean, actualHash: string }}
 */
const decryptBuffer = (encryptedBuffer, ivHex, authTagHex, expectedHash) => {
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  // Decrypt - throws error if authTag verification fails (e.g. tampered data)
  const decryptedBuffer = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);

  // Verify SHA-256 integrity
  const actualHash = calculateSHA256(decryptedBuffer);
  const hashVerified = expectedHash ? (actualHash.toLowerCase() === expectedHash.toLowerCase()) : true;

  if (expectedHash && !hashVerified) {
    throw new Error(`File integrity check failed: expected hash ${expectedHash}, computed ${actualHash}`);
  }

  return {
    decryptedBuffer,
    hashVerified,
    actualHash,
  };
};

/**
 * Encrypts a file on disk from sourcePath to destPath
 * @param {string} sourcePath
 * @param {string} destPath
 * @returns {Promise<{ iv: string, authTag: string, fileHash: string, fileSize: number }>}
 */
const encryptFileToDisk = async (sourcePath, destPath) => {
  const plaintextBuffer = await fs.promises.readFile(sourcePath);
  const result = encryptBuffer(plaintextBuffer);
  await fs.promises.writeFile(destPath, result.encryptedBuffer);
  return {
    iv: result.iv,
    authTag: result.authTag,
    fileHash: result.fileHash,
    fileSize: result.originalSize,
  };
};

/**
 * Decrypts a file from disk and returns verified plaintext buffer
 * @param {string} encryptedPath
 * @param {string} ivHex
 * @param {string} authTagHex
 * @param {string} expectedHash
 * @returns {Promise<Buffer>}
 */
const decryptFileFromDisk = async (encryptedPath, ivHex, authTagHex, expectedHash) => {
  const encryptedBuffer = await fs.promises.readFile(encryptedPath);
  const { decryptedBuffer } = decryptBuffer(encryptedBuffer, ivHex, authTagHex, expectedHash);
  return decryptedBuffer;
};

module.exports = {
  calculateSHA256,
  calculateFileSHA256,
  encryptBuffer,
  decryptBuffer,
  encryptFileToDisk,
  decryptFileFromDisk,
};
