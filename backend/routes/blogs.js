import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  getBlogs,
  getAdminBlogs,
  getBlogById,
  getBlogBySlug,
  getRelatedBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  duplicateBlog,
  updateBlogStatus,
  updateBlogFeatured,
  uploadBlogImage,
} from '../controllers/blogs.js';
import { protect } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^\w-]/g, '');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `blog-${cleanName}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
    'image/svg+xml',
    'image/gif',
    'image/avif',
  ];
  if (allowed.includes(file.mimetype) || (file.mimetype && file.mimetype.startsWith('image/'))) {
    cb(null, true);
  } else {
    cb(
      new Error(`Unsupported image format (${file.mimetype}). Please upload JPG, PNG, WEBP, SVG, or GIF.`),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter,
});

const uploadMiddleware = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size exceeds the 5 MB limit. Please choose a smaller photo.',
        });
      }
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

const router = express.Router();

// Public / Admin Dispatch Routes
router.get('/', (req, res, next) => {
  if (req.baseUrl.includes('admin') || req.query.admin === 'true') {
    return protect(req, res, () => getAdminBlogs(req, res, next));
  }
  return getBlogs(req, res, next);
});
router.get('/:slug/related', getRelatedBlogs);

// Admin Routes (Specific paths before parameterized /:id)
router.get('/admin/all', protect, getAdminBlogs);
router.get('/admin', protect, getAdminBlogs);
router.get('/all', protect, getAdminBlogs);
router.post('/upload-image', protect, uploadMiddleware, uploadBlogImage);

// Parameterized Routes
router.get('/:id', getBlogById);
router.post('/', protect, createBlog);
router.put('/:id', protect, updateBlog);
router.delete('/:id', protect, deleteBlog);
router.post('/:id/duplicate', protect, duplicateBlog);
router.patch('/:id/status', protect, updateBlogStatus);
router.patch('/:id/featured', protect, updateBlogFeatured);

export default router;
