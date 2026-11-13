const SecurityLog = require('../models/SecurityLog');

/**
 * Log a security-relevant activity
 * @param {object} params
 * @param {string} [params.userId]
 * @param {string} params.activity
 * @param {string} [params.ipAddress]
 * @param {'SUCCESS'|'FAILURE'|'WARNING'|'ALERT'} [params.status]
 * @param {object} [params.details]
 */
const logSecurityEvent = async ({
  userId,
  activity,
  ipAddress = '127.0.0.1',
  status = 'SUCCESS',
  details = {},
}) => {
  try {
    await SecurityLog.create({
      userId,
      activity,
      ipAddress,
      status,
      details,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('[SECURITY-LOGGER] Failed to persist security log:', err.message);
  }
};

/**
 * Helper to extract client IP address from express request
 */
const getClientIp = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1'
  );
};

module.exports = {
  logSecurityEvent,
  getClientIp,
};
