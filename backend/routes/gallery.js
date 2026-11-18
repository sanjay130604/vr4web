import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  getGalleryImages,
  getFeaturedGalleryImages,
  getAdminGalleryImages,
  getGalleryById,
  createGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
  restoreGalleryImage,
  toggleFeaturedGalleryImage,
  updateGalleryImageStatus,
  hardDeleteGalleryImage,
} from '../controllers/gallery.js';
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
    cb(null, `gallery-${cleanName}-${uniqueSuffix}${ext}`);
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max for high-res gallery images
  fileFilter,
});

const uploadMiddleware = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size exceeds the 10 MB limit. Please choose a smaller photo.',
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

// ── Admin File Upload Endpoints ──
router.post('/upload-image', protect, uploadMiddleware, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please select an image file to upload.' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.status(200).json({
    success: true,
    message: 'Gallery image uploaded successfully',
    fileUrl,
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    size: req.file.size,
  });
});

router.post('/upload', protect, uploadMiddleware, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please select an image file to upload.' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  res.status(200).json({
    success: true,
    message: 'Gallery image uploaded successfully',
    fileUrl,
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    size: req.file.size,
  });
});

// ── Admin Listing Endpoints ──
router.get('/admin', protect, getAdminGalleryImages);
router.get('/admin/all', protect, getAdminGalleryImages);

// ── Public / Admin Gallery APIs (Must be defined before parameterized /:id) ──
router.get('/featured', getFeaturedGalleryImages);
router.get('/public', getGalleryImages);
router.get('/', (req, res, next) => {
  if (req.baseUrl.includes('admin') || req.query.admin === 'true') {
    return protect(req, res, () => getAdminGalleryImages(req, res, next));
  }
  return getGalleryImages(req, res, next);
});

// ── Admin Protected CRUD APIs ──
router.post('/', protect, createGalleryImage);

// ── Parameterized Route for Single Gallery Item (Public View with Admin Fallback) ──
router.get('/:id', getGalleryById);

// ── Admin Protected Mutation APIs ──
router.put('/:id', protect, updateGalleryImage);
router.delete('/:id', protect, deleteGalleryImage);
router.patch('/:id/restore', protect, restoreGalleryImage);
router.patch('/:id/featured', protect, toggleFeaturedGalleryImage);
router.patch('/:id/status', protect, updateGalleryImageStatus);
router.delete('/:id/permanent', protect, hardDeleteGalleryImage);

export default router;
