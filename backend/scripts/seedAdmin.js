import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

export const seedAdmin = async () => {
  try {
    const adminEmail = (process.env.ADMIN_INITIAL_EMAIL || 'sanjay@niftysoft.in').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'admin@123';

    const existingAdmin = await Admin.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log(`[Seed] Admin already initialized: ${adminEmail}`);
    } else {
      const newAdmin = new Admin({
        email: adminEmail,
        password: adminPassword,
        name: 'Sanjay (VR4Web Administrator)',
        role: 'superadmin',
      });
      await newAdmin.save();
      console.log(`[Seed] Successfully created default admin: ${adminEmail} (password securely hashed with bcrypt)`);
    }
  } catch (err) {
    console.error(`[Seed] Seed error: ${err.message}`);
  }
};

// If run directly from CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/vr4web';
  mongoose
    .connect(mongoUri)
    .then(async () => {
      console.log('[Seed] Connected to MongoDB');
      await seedAdmin();
      await mongoose.disconnect();
      console.log('[Seed] Done. Disconnected.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed] Database connection error:', err);
      process.exit(1);
    });
}

export default seedAdmin;
