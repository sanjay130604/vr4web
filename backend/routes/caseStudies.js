import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  getAdminCaseStudies,
  getCaseStudyById,
  createCaseStudy,
  updateCaseStudy,
  publishCaseStudy,
  unpublishCaseStudy,
  deleteCaseStudy,
  duplicateCaseStudy,
  uploadImage,
  getPublicCaseStudies,
  getPublicCaseStudyBySlug,
} from '../controllers/caseStudies.js';
import { protect } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Storage Configuration
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
    cb(null, `${cleanName}-${uniqueSuffix}${ext}`);
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
    cb(new Error(`Unsupported file format (${file.mimetype || 'unknown'}). Please upload JPG, PNG, WEBP, SVG, or GIF.`), false);
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
          message: 'File size exceeds the 5 MB limit. Please upload a smaller image file.',
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`,
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Invalid image file provided.',
      });
    }
    next();
  });
};

const router = express.Router();

// Public Endpoints
router.get('/public', getPublicCaseStudies);
router.get('/public/:slug', getPublicCaseStudyBySlug);

// Admin Endpoints (Protected)
router.get('/', protect, getAdminCaseStudies);
router.get('/:id', protect, getCaseStudyById);
router.post('/', protect, createCaseStudy);
router.put('/:id', protect, updateCaseStudy);
router.patch('/:id/publish', protect, publishCaseStudy);
router.patch('/:id/unpublish', protect, unpublishCaseStudy);
router.post('/:id/duplicate', protect, duplicateCaseStudy);
router.delete('/:id', protect, deleteCaseStudy);
router.post('/upload-image', protect, uploadMiddleware, uploadImage);

export default router;

