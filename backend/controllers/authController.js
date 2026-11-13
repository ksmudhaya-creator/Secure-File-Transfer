const jwt = require('jsonwebtoken');
const User = require('../models/User');
const File = require('../models/File');
const TransferSession = require('../models/TransferSession');
const { logSecurityEvent, getClientIp } = require('../middleware/securityLogger');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const ipAddress = getClientIp(req);

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: username, email, password.',
      });
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      await logSecurityEvent({
        activity: 'REGISTRATION_DUPLICATE_ATTEMPT',
        ipAddress,
        status: 'WARNING',
        details: { email, username },
      });
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists.',
      });
    }

    // If first user, make admin for convenience, else user
    const totalUsers = await User.countDocuments();
    const role = totalUsers === 0 ? 'admin' : 'user';

    const user = await User.create({
      username,
      email,
      password,
      role,
    });

    const token = generateToken(user._id);

    await logSecurityEvent({
      userId: user._id,
      activity: 'USER_REGISTERED',
      ipAddress,
      status: 'SUCCESS',
      details: { username: user.username, email: user.email, role: user.role },
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ipAddress = getClientIp(req);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      await logSecurityEvent({
        activity: 'LOGIN_FAILED_UNKNOWN_EMAIL',
        ipAddress,
        status: 'FAILURE',
        details: { attemptedEmail: email },
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    if (user.isBlocked) {
      await logSecurityEvent({
        userId: user._id,
        activity: 'BLOCKED_USER_LOGIN_ATTEMPT',
        ipAddress,
        status: 'ALERT',
        details: { email: user.email },
      });
      return res.status(403).json({
        success: false,
        message: 'Account is blocked. Please contact the security administrator.',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      await logSecurityEvent({
        userId: user._id,
        activity: 'LOGIN_FAILED_INVALID_PASSWORD',
        ipAddress,
        status: 'FAILURE',
        details: { email: user.email },
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    const token = generateToken(user._id);

    await logSecurityEvent({
      userId: user._id,
      activity: 'LOGIN_SUCCESS',
      ipAddress,
      status: 'SUCCESS',
      details: { email: user.email, role: user.role },
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const filesCount = await File.countDocuments({ owner: user._id });
    const sessionsCount = await TransferSession.countDocuments({ userId: user._id });

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
        createdAt: user.createdAt,
        stats: {
          filesCount,
          sessionsCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log out user & record security event
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res) => {
  const ipAddress = getClientIp(req);
  await logSecurityEvent({
    userId: req.user?._id,
    activity: 'LOGOUT_SUCCESS',
    ipAddress,
    status: 'SUCCESS',
    details: { email: req.user?.email },
  });

  res.json({
    success: true,
    message: 'Session closed successfully.',
  });
};

module.exports = {
  register,
  login,
  getProfile,
  logout,
};
