const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    originalName: {
      type: String,
      trim: true,
    },
    mimeType: {
      type: String,
      default: 'application/octet-stream',
    },
    encryptedFilePath: {
      type: String,
      required: [true, 'Encrypted file path is required'],
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
    },
    fileHash: {
      type: String,
      required: [true, 'SHA-256 file hash is required'],
    },
    iv: {
      type: String,
      required: [true, 'AES IV is required'],
    },
    authTag: {
      type: String,
      required: [true, 'AES GCM Auth Tag is required'],
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('File', fileSchema);
