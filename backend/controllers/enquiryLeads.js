import EnquiryLead from '../models/EnquiryLead.js';
import {
  sendEnquiryAdminNotification,
  sendEnquiryUserAcknowledgement,
  sendAdminReplyEmail,
} from '../services/emailService.js';

/**
 * @route   POST /api/enquiry-leads
 * @desc    Submit public project enquiry form
 * @access  Public
 */
export const createEnquiryLead = async (req, res) => {
  try {
    const rawName = req.body.name || req.body.fullName || '';
    const name = rawName.trim();
    const {
      email,
      phone,
      countryCode,
      company,
      projectType,
      customProjectType,
      service,
      projectBudget,
      budget,
      aboutProject,
      message,
    } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide your full name.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a valid work email.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email format.' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide your phone number.' });
    }

    const finalMessage = message && message.trim() ? message.trim() : aboutProject || '';
    if (!finalMessage) {
      return res.status(400).json({ success: false, message: 'Please provide a brief description of your project.' });
    }

    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    let resolvedProjectType = (projectType || service || '').trim();
    if (resolvedProjectType === 'Other' || !resolvedProjectType) {
      if (customProjectType && customProjectType.trim()) {
        resolvedProjectType = customProjectType.trim();
      } else {
        resolvedProjectType = 'General';
      }
    } else if (customProjectType && customProjectType.trim()) {
      resolvedProjectType = customProjectType.trim();
    }

    const enquiry = await EnquiryLead.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      countryCode: countryCode ? countryCode.trim() : '+61',
      company: company ? company.trim() : '',
      projectType: resolvedProjectType,
      customProjectType: customProjectType ? customProjectType.trim() : '',
      projectBudget: projectBudget || budget || 'Prefer to Discuss',
      aboutProject: aboutProject || resolvedProjectType || 'Project Enquiry',
      message: finalMessage,
      status: 'New',
      ipAddress,
      userAgent,
      emailHistory: [],
    });

    // Send notifications in background
    Promise.allSettled([
      sendEnquiryAdminNotification(enquiry),
      sendEnquiryUserAcknowledgement(enquiry),
    ]).catch((err) => {
      console.error('[EnquiryLead] Email notification error:', err);
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you for contacting VR4Web. Our team will review your project enquiry and get back to you soon.',
      data: enquiry,
    });
  } catch (error) {
    console.error('[createEnquiryLead Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit project enquiry. Please try again or contact us directly.',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/enquiry-leads
 * @desc    Get all enquiry leads with search, filters, pagination, and counts
 * @access  Private (Admin)
 */
export const getAllEnquiryLeads = async (req, res) => {
  try {
    const {
      search,
      status,
      projectType,
      projectBudget,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = { isDeleted: { $ne: true } };

    // Search filter across name, email, phone, company, and message
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { company: searchRegex },
        { projectType: searchRegex },
        { message: searchRegex },
      ];
    }

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Project Type filter
    if (projectType && projectType !== 'all') {
      query.projectType = projectType;
    }

    // Budget filter
    if (projectBudget && projectBudget !== 'all') {
      query.projectBudget = projectBudget;
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

    const [enquiries, total, newCount, contactedCount, closedCount, visitedCount] =
      await Promise.all([
        EnquiryLead.find(query).sort(sortOptions).skip(skip).limit(limitNum).lean(),
        EnquiryLead.countDocuments(query),
        EnquiryLead.countDocuments({ isDeleted: { $ne: true }, status: 'New' }),
        EnquiryLead.countDocuments({ isDeleted: { $ne: true }, status: 'Contacted' }),
        EnquiryLead.countDocuments({ isDeleted: { $ne: true }, status: 'Closed' }),
        EnquiryLead.countDocuments({ isDeleted: { $ne: true }, status: 'Visited' }),
      ]);

    const totalAll = await EnquiryLead.countDocuments({ isDeleted: { $ne: true } });
    const totalPages = Math.ceil(total / limitNum) || 1;

    return res.status(200).json({
      success: true,
      data: enquiries,
      count: enquiries.length,
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
        closed: closedCount,
        visited: visitedCount,
      },
    });
  } catch (error) {
    console.error('[getAllEnquiryLeads Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   GET /api/enquiry-leads/:id
 * @desc    Get single enquiry lead by ID
 * @access  Private (Admin)
 */
export const getEnquiryLeadById = async (req, res) => {
  try {
    const enquiry = await EnquiryLead.findById(req.params.id);
    if (!enquiry || enquiry.isDeleted) {
      return res.status(404).json({ success: false, message: 'Enquiry lead not found.' });
    }

    return res.status(200).json({ success: true, data: enquiry });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   PATCH /api/enquiry-leads/:id/status
 * @desc    Update enquiry lead status
 * @access  Private (Admin)
 */
export const updateEnquiryLeadStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['New', 'Contacted', 'Visited', 'Not Visited', 'Closed'];

    if (!status || !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowed.join(', ')}`,
      });
    }

    const enquiry = await EnquiryLead.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: 'after', runValidators: true }
    );

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry lead not found.' });
    }

    return res.status(200).json({
      success: true,
      message: `Enquiry status updated to ${status}`,
      data: enquiry,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   POST /api/enquiry-leads/:id/reply
 * @desc    Send email reply to enquiry lead and record history
 * @access  Private (Admin)
 */
export const replyToEnquiryLead = async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ success: false, message: 'Reply subject is required.' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Reply message body is required.' });
    }

    const enquiry = await EnquiryLead.findById(req.params.id);
    if (!enquiry || enquiry.isDeleted) {
      return res.status(404).json({ success: false, message: 'Enquiry lead not found.' });
    }

    const adminEmail = req.admin?.email || 'admin@vr4web.com';

    // Dispatch email
    const emailResult = await sendAdminReplyEmail({
      to: enquiry.email,
      subject: subject.trim(),
      message: message.trim(),
      adminEmail,
    });

    const replyEntry = {
      subject: subject.trim(),
      message: message.trim(),
      sentTo: enquiry.email,
      sentAt: new Date(),
      sentBy: adminEmail,
      emailStatus: emailResult.success ? 'sent' : emailResult.mock ? 'logged' : 'failed',
    };

    enquiry.emailHistory.unshift(replyEntry);

    // Auto-update status to 'Contacted' when mail is sent
    if (enquiry.status !== 'Closed') {
      enquiry.status = 'Contacted';
    }

    await enquiry.save();

    return res.status(200).json({
      success: true,
      message: 'Reply sent successfully and recorded in email history.',
      data: enquiry,
      emailDelivery: emailResult,
    });
  } catch (error) {
    console.error('[replyToEnquiryLead Error]:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @route   DELETE /api/enquiry-leads/:id
 * @desc    Delete enquiry lead
 * @access  Private (Admin)
 */
export const deleteEnquiryLead = async (req, res) => {
  try {
    const enquiry = await EnquiryLead.findByIdAndDelete(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry lead not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Enquiry lead deleted successfully.',
      data: { id: req.params.id },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

