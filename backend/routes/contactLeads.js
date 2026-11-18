import express from 'express';
import {
  createContactLead,
  getAllContactLeads,
  getContactLeadById,
  updateContactLeadStatus,
  replyToContactLead,
  deleteContactLead,
} from '../controllers/contactLeads.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public: Contact Form submission
router.post('/', createContactLead);

// Protected: Admin Management routes
router.get('/', protect, getAllContactLeads);
router.get('/:id', protect, getContactLeadById);
router.patch('/:id/status', protect, updateContactLeadStatus);
router.put('/:id/status', protect, updateContactLeadStatus); // Friendly alias
router.post('/:id/reply', protect, replyToContactLead);
router.delete('/:id', protect, deleteContactLead);

export default router;

