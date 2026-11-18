import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

// Helper to sign JWT
const signToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'vr4web_ultra_secure_jwt_token_secret_key_2026_x89a',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

// Helper to set HTTP-only cookie
const sendTokenResponse = (admin, statusCode, res) => {
  const token = signToken(admin._id);

  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  };

  res.cookie('admin_token', token, cookieOptions);

  res.status(statusCode).json({
    success: true,
    token, // Also returned in body for optional frontend bearer header backup
    admin: {
      id: admin._id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      lastLogin: admin.lastLogin,
    },
    message: 'Authentication successful',
  });
};

/**
 * @desc    Admin login
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email address and password.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Query admin
    const admin = await Admin.findOne({ email: cleanEmail });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    // Verify bcrypt password
    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    sendTokenResponse(admin, 200, res);
  } catch (error) {
    console.error('[Auth Controller] Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred during login. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @desc    Get currently logged-in admin
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('-password');
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin account not found.',
      });
    }

    res.status(200).json({
      success: true,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    console.error('[Auth Controller] getMe Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving admin profile.',
    });
  }
};

/**
 * @desc    Admin logout / clear cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logout = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('admin_token', 'none', {
      expires: new Date(Date.now() - 1000),
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    console.error('[Auth Controller] Logout Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging out.',
    });
  }
};

export default {
  login,
  getMe,
  logout,
};

