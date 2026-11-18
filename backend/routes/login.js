import express from 'express';
import { login, getMe, logout } from '../controllers/login.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/logout', logout);

export default router;

