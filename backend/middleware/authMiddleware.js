const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logSecurityEvent, getClientIp } = require('./securityLogger');

const protect = async (req, res, next) => {
  let token;
  const ipAddress = getClientIp(req);

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        await logSecurityEvent({
          activity: 'AUTH_FAILED_USER_NOT_FOUND',
          ipAddress,
          status: 'WARNING',
          details: { attemptedUserId: decoded.id },
        });
        return res.status(401).json({
          success: false,
          message: 'Security Alert: User associated with token no longer exists.',
        });
      }

      if (user.isBlocked) {
        await logSecurityEvent({
          userId: user._id,
          activity: 'BLOCKED_USER_ACCESS_ATTEMPT',
          ipAddress,
          status: 'ALERT',
          details: { email: user.email, username: user.username },
        });
        return res.status(403).json({
          success: false,
          message: 'Access Denied: Your account has been blocked by an administrator for security compliance.',
        });
      }

      req.user = user;
      next();
    } catch (error) {
      await logSecurityEvent({
        activity: 'INVALID_TOKEN_ATTEMPT',
        ipAddress,
        status: 'WARNING',
        details: { error: error.message },
      });
      return res.status(401).json({
        success: false,
        message: 'Security Alert: Invalid, tampered, or expired session token.',
      });
    }
  } else {
    await logSecurityEvent({
      activity: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      ipAddress,
      status: 'WARNING',
      details: { path: req.originalUrl, method: req.method },
    });
    return res.status(401).json({
      success: false,
      message: 'Access Denied: No authentication token provided.',
    });
  }
};

module.exports = { protect };
