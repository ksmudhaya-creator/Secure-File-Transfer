const User = require('../models/User');
const TransferSession = require('../models/TransferSession');
const SecurityLog = require('../models/SecurityLog');
const File = require('../models/File');
const { STATES } = require('../stateMachine/fsmConfig');
const { logSecurityEvent, getClientIp } = require('../middleware/securityLogger');

/**
 * @desc    Get all registered users with file/session counts
 * @route   GET /api/admin/users
 * @access  Private (Admin Only)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    const enrichedUsers = await Promise.all(
      users.map(async (u) => {
        const fileCount = await File.countDocuments({ owner: u._id });
        const sessionCount = await TransferSession.countDocuments({ userId: u._id });
        return {
          ...u.toObject(),
          fileCount,
          sessionCount,
        };
      })
    );

    res.json({
      success: true,
      count: enrichedUsers.length,
      users: enrichedUsers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle block/unblock status for a user
 * @route   PATCH /api/admin/users/:id/toggle-block
 * @access  Private (Admin Only)
 */
const toggleUserBlock = async (req, res, next) => {
  const ipAddress = getClientIp(req);

  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Security Policy: Administrator cannot block their own account.',
      });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    await logSecurityEvent({
      userId: req.user._id,
      activity: user.isBlocked ? 'USER_BLOCKED_BY_ADMIN' : 'USER_UNBLOCKED_BY_ADMIN',
      ipAddress,
      status: 'WARNING',
      details: {
        targetUserId: user._id,
        targetEmail: user.email,
        newStatus: user.isBlocked ? 'BLOCKED' : 'ACTIVE',
      },
    });

    res.json({
      success: true,
      message: `User '${user.username}' has been ${user.isBlocked ? 'blocked' : 'unblocked'}.`,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        isBlocked: user.isBlocked,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get system-wide transfer sessions
 * @route   GET /api/admin/sessions
 * @access  Private (Admin Only)
 */
const getAllSessions = async (req, res, next) => {
  try {
    const { state, status } = req.query;
    const filter = {};

    if (state && STATES[state]) {
      filter.currentState = state;
    }

    if (status === 'active') {
      filter.currentState = {
        $in: [STATES.INITIATED, STATES.AUTHENTICATING, STATES.READY, STATES.UPLOADING, STATES.VERIFYING],
      };
    } else if (status === 'failed') {
      filter.currentState = STATES.FAILED;
    }

    const sessions = await TransferSession.find(filter)
      .populate('userId', 'username email')
      .populate('fileId', 'fileName fileSize fileHash')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get system-wide security audit logs
 * @route   GET /api/admin/logs
 * @access  Private (Admin Only)
 */
const getSecurityLogs = async (req, res, next) => {
  try {
    const { status, activity, limit = 100 } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (activity) {
      filter.activity = { $regex: activity, $options: 'i' };
    }

    const logs = await SecurityLog.find(filter)
      .populate('userId', 'username email role')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit, 10));

    res.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get admin cybersecurity overview & telemetry
 * @route   GET /api/admin/stats
 * @access  Private (Admin Only)
 */
const getAdminTelemetry = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const blockedUsers = await User.countDocuments({ isBlocked: true });
    const totalFiles = await File.countDocuments();
    const totalSessions = await TransferSession.countDocuments();
    
    const activeTransfers = await TransferSession.countDocuments({
      currentState: {
        $in: [STATES.INITIATED, STATES.AUTHENTICATING, STATES.READY, STATES.UPLOADING, STATES.VERIFYING],
      },
    });

    const failedTransfers = await TransferSession.countDocuments({
      currentState: STATES.FAILED,
    });

    const securityAlerts = await SecurityLog.countDocuments({
      status: { $in: ['ALERT', 'WARNING'] },
    });

    const unauthorizedAttempts = await SecurityLog.countDocuments({
      activity: { $regex: 'UNAUTHORIZED', $options: 'i' },
    });

    // Recent security alerts
    const recentAlerts = await SecurityLog.find({ status: { $in: ['ALERT', 'WARNING'] } })
      .populate('userId', 'username email')
      .sort({ timestamp: -1 })
      .limit(10);

    res.json({
      success: true,
      telemetry: {
        totalUsers,
        blockedUsers,
        totalFiles,
        totalSessions,
        activeTransfers,
        failedTransfers,
        securityAlerts,
        unauthorizedAttempts,
      },
      recentAlerts,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  toggleUserBlock,
  getAllSessions,
  getSecurityLogs,
  getAdminTelemetry,
};
