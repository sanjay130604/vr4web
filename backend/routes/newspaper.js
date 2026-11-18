import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  getPublicNewspapers,
  getPublicNewspaperById,
  getAdminNewspapers,
  getAdminNewspaperById,
  createNewspaper,
  updateNewspaper,
  deleteNewspaper,
  updateNewspaperStatus,
  uploadNewspaperImage,
  uploadNewspaperPdf,
} from '../controllers/newspaper.js';
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
    const prefix = file.mimetype === 'application/pdf' ? 'newspaper-pdf' : 'newspaper-img';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${prefix}-${cleanName}-${uniqueSuffix}${ext}`);
  },
});

// Image file filter
const imageFileFilter = (req, file, cb) => {
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
      new Error(`Unsupported image format (${file.mimetype}). Please upload JPG, PNG, WEBP, or SVG.`),
      false
    );
  }
};

// PDF file filter
const pdfFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (file.mimetype === 'application/pdf' || ext === '.pdf') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Please upload a PDF file only.'), false);
  }
};

const uploadImage = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: imageFileFilter,
});

const uploadPdf = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
  fileFilter: pdfFileFilter,
});

const imageUploadMiddleware = (req, res, next) => {
  uploadImage.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Image file size exceeds the 10 MB limit.',
        });
      }
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

const pdfUploadMiddleware = (req, res, next) => {
  uploadPdf.single('pdf')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'PDF file size exceeds the 50 MB limit.',
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
    return protect(req, res, () => getAdminNewspapers(req, res, next));
  }
  return getPublicNewspapers(req, res, next);
});
router.get('/public', getPublicNewspapers);

// Admin Routes (Specific paths before parameterized /:id)
router.get('/admin/all', protect, getAdminNewspapers);
router.get('/admin', protect, getAdminNewspapers);
router.get('/admin/:id', protect, getAdminNewspaperById);
router.post('/upload-image', protect, imageUploadMiddleware, uploadNewspaperImage);
router.post('/upload-pdf', protect, pdfUploadMiddleware, uploadNewspaperPdf);

// Parameterized & CRUD Routes
router.get('/:id', (req, res, next) => {
  if (req.params.id === 'admin') return protect(req, res, () => getAdminNewspapers(req, res, next));
  getPublicNewspaperById(req, res, next);
});
router.post('/', protect, createNewspaper);
router.put('/:id', protect, updateNewspaper);
router.put('/admin/:id', protect, updateNewspaper);
router.delete('/:id', protect, deleteNewspaper);
router.delete('/admin/:id', protect, deleteNewspaper);
router.patch('/:id/status', protect, updateNewspaperStatus);
router.patch('/admin/:id/status', protect, updateNewspaperStatus);

export default router;
