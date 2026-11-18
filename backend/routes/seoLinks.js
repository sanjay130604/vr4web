import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getPages,
  getPageById,
  updatePageTargets,
  triggerSyncPages,
  getAnalytics,
  getLinks,
  createLink,
  updateLink,
  deleteLink,
  validateSingleLink,
  validateAllLinks,
  analyzePage,
  getBrokenLinks,
  exportLinks,
  getPublicPageLinks,
} from '../controllers/seoLinks.js';

const router = express.Router();

// ─── Public Endpoint for Dynamic Frontend Link Rendering ───
router.get('/public/:pageSlug', getPublicPageLinks);

// ─── Protected Admin Endpoints ───
router.use(protect);

// Analytics & Reports
router.get('/analytics', getAnalytics);
router.get('/broken', getBrokenLinks);
router.get('/export', exportLinks);

// Page Management
router.get('/pages', getPages);
router.post('/pages/sync', triggerSyncPages);
router.get('/pages/:id', getPageById);
router.put('/pages/:id', updatePageTargets);
router.post('/analyze/:pageId', analyzePage);

// Link Validation Actions
router.post('/validate-all', validateAllLinks);
router.post('/validate/:id', validateSingleLink);

// Link CRUD
router.get('/', getLinks);
router.post('/', createLink);
router.put('/:id', updateLink);
router.delete('/:id', deleteLink);

export default router;

