const rateLimit = require('express-rate-limit');

// General API Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Rate limit exceeded: Too many requests from this IP, please try again in 15 minutes.',
  },
});

// Authentication Rate Limiter (Brute force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // Limit each IP to 30 login/register requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Security Alert: Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
};
