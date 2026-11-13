const multer = require('multer');
const path = require('path');
const fs = require('fs');

const tempUploadDir = path.join(__dirname, '..', 'uploads', 'temp');
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

// Storage engine: store temporarily before AES-256-GCM encryption
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `temp-${uniqueSuffix}-${sanitizedName}`);
  },
});

// Dangerous executable file extension filter
const BLOCKED_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.vbs',
  '.msi',
  '.com',
  '.scr',
  '.pif',
  '.ps1',
  '.jar',
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    const error = new Error(`Security Exception: File extension '${ext}' is classified as potentially dangerous and is prohibited.`);
    error.code = 'UNSAFE_FILE_TYPE';
    return cb(error, false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB maximum size limit
  },
  fileFilter,
});

module.exports = upload;
