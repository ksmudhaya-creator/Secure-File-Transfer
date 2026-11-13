const express = require('express');
const router = express.Router();
const {
  uploadFile,
  getFiles,
  downloadFile,
  verifyFileIntegrity,
  deleteFile,
} = require('../controllers/fileController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/upload', protect, upload.single('file'), uploadFile);
router.get('/', protect, getFiles);
router.get('/:id/download', protect, downloadFile);
router.get('/:id/verify', protect, verifyFileIntegrity);
router.delete('/:id', protect, deleteFile);

module.exports = router;
