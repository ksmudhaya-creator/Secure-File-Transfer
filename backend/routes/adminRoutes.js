const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  toggleUserBlock,
  getAllSessions,
  getSecurityLogs,
  getAdminTelemetry,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// All routes are protected and admin-only
router.use(protect, adminOnly);

router.get('/users', getAllUsers);
router.patch('/users/:id/toggle-block', toggleUserBlock);
router.get('/sessions', getAllSessions);
router.get('/logs', getSecurityLogs);
router.get('/stats', getAdminTelemetry);

module.exports = router;
