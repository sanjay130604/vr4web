import ContactLead from '../models/ContactLead.js';
import {
  sendContactAdminNotification,
  sendContactUserAcknowledgement,
  sendAdminReplyEmail,
} from '../services/emailService.js';

/**
 * @route   POST /api/contact-leads
 * @desc    Submit public contact form
 * @access  Public
 */
export const createContactLead = async (req, res) => {
  try {
    const rawName = req.body.name || req.body.fullName || '';
    const { email, phone, phoneCode, subject, message } = req.body;
    const name = rawName.trim();

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide your full name.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email format.' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide your phone number.' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter your message.' });
    }

    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    // Create and save lead in MongoDB
    const lead = await ContactLead.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      phoneCode: phoneCode ? phoneCode.trim() : '+61',
      subject: subject && subject.trim() ? subject.trim() : 'General Website Enquiry',
      message: message.trim(),
      status: 'New',
      ipAddress,
      userAgent,
      emailHistory: [],
    });

    // Send notifications in background (does not block response or fail lead creation)
    Promise.allSettled([
      sendContactAdminNotification(lead),
      sendContactUserAcknowledgement(lead),
    ]).catch((err) => {
      console.error('[ContactLead] Email notification error:', err);
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you for contacting VR4Web. Our team will get back to you soon.',
      data: lead,
    });
  } catch (error) {
    console.error('[createContactLead Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit contact enquiry. Please try again or contact us directly.',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/contact-leads
 * @desc    Get all contact leads with search, filter, pagination, and counts
 * @access  Private (Admin)
 */
export const getAllContactLeads = async (req, res) => {
  try {
    const {
      search,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = { isDeleted: { $ne: true } };

    // Search filter across name, email, phone, and subject
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { subject: searchRegex },
      ];
    }

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    sortOptions._id = -1;

    // Execute queries
    const [leads, total, newCount, contactedCount, visitedCount, notVisitedCount, closedCount] =
      await Promise.all([
        ContactLead.find(query).sort(sortOptions).skip(skip).limit(limitNum).lean(),
        ContactLead.countDocuments(query),
        ContactLead.countDocuments({ isDeleted: { $ne: true }, status: 'New' }),
        ContactLead.countDocuments({ isDeleted: { $ne: true }, status: 'Contacted' }),
        ContactLead.countDocuments({ isDeleted: { $ne: true }, status: 'Visited' }),
        ContactLead.countDocuments({ isDeleted: { $ne: true }, status: 'Not Visited' }),
        ContactLead.countDocuments({ isDeleted: { $ne: true }, status: 'Closed' }),
      ]);

    const totalAll = await ContactLead.countDocuments({ isDeleted: { $ne: true } });
    const totalPages = Math.ceil(total / limitNum) || 1;

    return res.status(200).json({
      success: true,
      data: leads,
      count: leads.length,
      total,
      totalRecords: total,
      page: pageNum,
      currentPage: pageNum,
      totalPages,
      pagination: {
        currentPage: pageNum,
        page: pageNum,
        limit: limitNum,
        pageSize: limitNum,
        totalRecords: total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      },
      counts: {
        total: totalAll,
        new: newCount,
        contacted: contactedCount,
        visited: visitedCount,
        notVisited: notVisitedCount,
        closed: closedCount,
      },
    });
  } catch (error) {
    console.error('[getAllContactLeads Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   GET /api/contact-leads/:id
 * @desc    Get single contact lead by ID
 * @access  Private (Admin)
 */
export const getContactLeadById = async (req, res) => {
  try {
    const lead = await ContactLead.findById(req.params.id);
    if (!lead || lead.isDeleted) {
      return res.status(404).json({ success: false, message: 'Contact lead not found.' });
    }

    return res.status(200).json({ success: true, data: lead });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   PATCH /api/contact-leads/:id/status
 * @desc    Update contact lead status
 * @access  Private (Admin)
 */
export const updateContactLeadStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['New', 'Contacted', 'Visited', 'Not Visited', 'Closed'];

    if (!status || !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowed.join(', ')}`,
      });
    }

    const lead = await ContactLead.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: 'after', runValidators: true }
    );

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Contact lead not found.' });
    }

    return res.status(200).json({
      success: true,
      message: `Lead status updated to ${status}`,
      data: lead,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   POST /api/contact-leads/:id/reply
 * @desc    Send email reply to contact lead and record history
 * @access  Private (Admin)
 */
export const replyToContactLead = async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ success: false, message: 'Reply subject is required.' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Reply message body is required.' });
    }

    const lead = await ContactLead.findById(req.params.id);
    if (!lead || lead.isDeleted) {
      return res.status(404).json({ success: false, message: 'Contact lead not found.' });
    }

    const adminEmail = req.admin?.email || 'admin@vr4web.com';

    // Dispatch email
    const emailResult = await sendAdminReplyEmail({
      to: lead.email,
      subject: subject.trim(),
      message: message.trim(),
      adminEmail,
    });

    const replyEntry = {
      subject: subject.trim(),
      message: message.trim(),
      sentTo: lead.email,
      sentAt: new Date(),
      sentBy: adminEmail,
      emailStatus: emailResult.success ? 'sent' : emailResult.mock ? 'logged' : 'failed',
    };

    lead.emailHistory.unshift(replyEntry);

    // Auto-update status to 'Contacted' when mail is sent
    if (lead.status !== 'Closed') {
      lead.status = 'Contacted';
    }

    await lead.save();

    return res.status(200).json({
      success: true,
      message: 'Reply sent successfully and recorded in email history.',
      data: lead,
      emailDelivery: emailResult,
    });
  } catch (error) {
    console.error('[replyToContactLead Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   DELETE /api/contact-leads/:id
 * @desc    Delete contact lead
 * @access  Private (Admin)
 */
export const deleteContactLead = async (req, res) => {
  try {
    const lead = await ContactLead.findByIdAndDelete(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Contact lead not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Contact lead deleted successfully.',
      data: { id: req.params.id },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

