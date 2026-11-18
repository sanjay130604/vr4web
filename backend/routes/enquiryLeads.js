import express from 'express';
import {
  createEnquiryLead,
  getAllEnquiryLeads,
  getEnquiryLeadById,
  updateEnquiryLeadStatus,
  replyToEnquiryLead,
  deleteEnquiryLead,
} from '../controllers/enquiryLeads.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public: Enquiry Form submission
router.post('/', createEnquiryLead);

// Protected: Admin Management routes
router.get('/', protect, getAllEnquiryLeads);
router.get('/:id', protect, getEnquiryLeadById);
router.patch('/:id/status', protect, updateEnquiryLeadStatus);
router.put('/:id/status', protect, updateEnquiryLeadStatus); // Friendly alias
router.post('/:id/reply', protect, replyToEnquiryLead);
router.delete('/:id', protect, deleteEnquiryLead);

export default router;

