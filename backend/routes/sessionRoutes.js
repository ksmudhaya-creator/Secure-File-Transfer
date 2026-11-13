const express = require('express');
const router = express.Router();
const {
  createSession,
  getSessions,
  getSessionById,
  updateSessionState,
  cancelSession,
  getDashboardStats,
} = require('../controllers/sessionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create', protect, createSession);
router.get('/', protect, getSessions);
router.get('/stats', protect, getDashboardStats);
router.get('/:id', protect, getSessionById);
router.patch('/:id/state', protect, updateSessionState);
router.post('/:id/cancel', protect, cancelSession);

module.exports = router;
