import express from 'express';
import {
  getAdminPricingPackages,
  getPricingStats,
  getPricingPackageById,
  createPricingPackage,
  updatePricingPackage,
  deletePricingPackage,
  togglePricingStatus,
  togglePricingFeatured,
  updatePricingOrder,
  duplicatePricingPackage,
  getPublicPricingPackages,
  getPublicPricingPackageById,
} from '../controllers/pricing.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ─── Public Endpoints ───
router.get('/public', getPublicPricingPackages);
router.get('/public/:id', getPublicPricingPackageById);

// ─── Admin Endpoints (Protected) ───
router.get('/admin/stats', protect, getPricingStats);
router.get('/stats', protect, getPricingStats);
router.get('/', protect, getAdminPricingPackages);
router.post('/', protect, createPricingPackage);
router.get('/:id', protect, getPricingPackageById);
router.put('/:id', protect, updatePricingPackage);
router.delete('/:id', protect, deletePricingPackage);
router.patch('/:id/status', protect, togglePricingStatus);
router.patch('/:id/featured', protect, togglePricingFeatured);
router.patch('/:id/order', protect, updatePricingOrder);
router.post('/:id/duplicate', protect, duplicatePricingPackage);

export default router;

