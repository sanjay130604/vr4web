import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vr4web';
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    // If localhost failed due to ipv6/ipv4 resolution, try 127.0.0.1
    if (process.env.MONGO_URI && process.env.MONGO_URI.includes('localhost')) {
      try {
        console.log('[MongoDB] Retrying with 127.0.0.1...');
        const fallbackUri = process.env.MONGO_URI.replace('localhost', '127.0.0.1');
        const conn = await mongoose.connect(fallbackUri);
        console.log(`[MongoDB] Connected via 127.0.0.1: ${conn.connection.name}`);
        return conn;
      } catch (err2) {
        console.error(`[MongoDB] Fallback connection failed: ${err2.message}`);
      }
    }
    throw error;
  }
};

export default connectDB;

