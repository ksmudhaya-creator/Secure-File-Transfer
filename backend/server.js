require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const User = require('./models/User');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const { startExpirationDaemon } = require('./services/sessionExpirationService');

const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Initialize Database Connection
const dbPromise = connectDB().then(async () => {
  // Seed initial admin and demo user if no users exist
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[SEED] Database empty. Seeding default Admin and Demo User...');
      await User.create({
        username: 'admin_secops',
        email: 'admin@cybersec.io',
        password: 'AdminPassword123!',
        role: 'admin',
      });
      await User.create({
        username: 'alice_crypto',
        email: 'user@cybersec.io',
        password: 'UserPassword123!',
        role: 'user',
      });
      console.log('[SEED] Default credentials ready:');
      console.log('       Admin: admin@cybersec.io / AdminPassword123!');
      console.log('       User:  user@cybersec.io  / UserPassword123!');
    }
  } catch (seedErr) {
    console.error('[SEED] Seeding error:', seedErr.message);
  }

  // Start background session expiration daemon
  startExpirationDaemon(30000);
});

// Security & Utility Middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    exposedHeaders: ['Content-Disposition', 'X-File-SHA256', 'X-Decryption-Status'],
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiter to all API endpoints
app.use('/api', apiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'Secure File Transfer Session State Management System',
    timestamp: new Date().toISOString(),
    fsmEngine: 'Active',
    encryption: 'AES-256-GCM',
    integrityAlgorithm: 'SHA-256',
  });
});

// Centralized Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
let server;

if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🛡️  SECURE FILE TRANSFER FSM BACKEND ACTIVE`);
    console.log(`🔒 Port:        http://localhost:${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`====================================================`);
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED REJECTION]', err.message);
});

module.exports = { app, server, dbPromise };

