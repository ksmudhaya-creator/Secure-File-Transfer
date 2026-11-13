const { logSecurityEvent, getClientIp } = require('./securityLogger');

const adminOnly = async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  const ipAddress = getClientIp(req);
  await logSecurityEvent({
    userId: req.user?._id,
    activity: 'UNAUTHORIZED_ADMIN_RESOURCE_ATTEMPT',
    ipAddress,
    status: 'ALERT',
    details: {
      userEmail: req.user?.email,
      attemptedPath: req.originalUrl,
      method: req.method,
    },
  });

  return res.status(403).json({
    success: false,
    message: 'Access Denied: High-privilege administrative rights required for this resource.',
  });
};

module.exports = { adminOnly };
