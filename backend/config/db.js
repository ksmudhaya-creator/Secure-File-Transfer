const mongoose = require('mongoose');

let mongoMemoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/secure_file_transfer';
  
  try {
    // Attempt standard connection first with 2.5s timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`[DB] Successfully connected to MongoDB at ${mongoose.connection.host}:${mongoose.connection.port}`);
  } catch (err) {
    console.warn(`[DB] Local MongoDB connection failed (${err.message}). Initializing embedded In-Memory MongoDB engine...`);
    
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      const memoryUri = mongoMemoryServer.getUri();
      
      await mongoose.connect(memoryUri);
      console.log(`[DB] Successfully connected to embedded In-Memory MongoDB at ${memoryUri}`);
    } catch (memErr) {
      console.error('[DB] Failed to initialize embedded MongoDB:', memErr.message);
      console.error('[DB] Please ensure MongoDB service is running locally or specify MONGO_URI in .env');
      process.exit(1);
    }
  }

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
    console.log('[DB] MongoDB disconnected cleanly.');
    process.exit(0);
  });
};

module.exports = connectDB;
