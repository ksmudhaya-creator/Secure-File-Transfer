const { logSecurityEvent, getClientIp } = require('./securityLogger');

const errorHandler = (err, req, res, next) => {
  console.error('[SERVER ERROR]', err);

  const ipAddress = getClientIp(req);
  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);

  // If unsafe file type or multer error
  if (err.code === 'UNSAFE_FILE_TYPE' || err.code === 'LIMIT_FILE_SIZE') {
    logSecurityEvent({
      userId: req.user?._id,
      activity: 'UNSAFE_UPLOAD_ATTEMPT',
      ipAddress,
      status: 'WARNING',
      details: {
        error: err.message,
        code: err.code,
      },
    });

    return res.status(400).json({
      success: false,
      message: err.message || 'File upload violation.',
    });
  }

  // FSM errors
  if (err.isFsmError) {
    return res.status(err.statusCode || 400).json({
      success: false,
      message: err.message,
      isFsmError: true,
    });
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = errorHandler;
