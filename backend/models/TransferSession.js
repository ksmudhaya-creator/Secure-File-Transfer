const mongoose = require('mongoose');

const stateHistorySchema = new mongoose.Schema(
  {
    fromState: {
      type: String,
      required: true,
    },
    toState: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    reason: {
      type: String,
      default: 'State transition executed',
    },
    progress: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const transferSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
    },
    fileName: {
      type: String,
      default: 'Pending File',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    transferType: {
      type: String,
      enum: ['UPLOAD', 'DOWNLOAD'],
      default: 'UPLOAD',
    },
    currentState: {
      type: String,
      enum: [
        'INITIATED',
        'AUTHENTICATING',
        'READY',
        'UPLOADING',
        'VERIFYING',
        'COMPLETED',
        'FAILED',
        'CANCELLED',
        'EXPIRED',
      ],
      default: 'INITIATED',
      index: true,
    },
    transferProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    stateHistory: [stateHistorySchema],
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('TransferSession', transferSessionSchema);
