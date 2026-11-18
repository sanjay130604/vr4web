import mongoose from 'mongoose';

const EmailHistorySchema = new mongoose.Schema(
  {
    subject: { type: String, required: true },
    message: { type: String, required: true },
    sentTo: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
    sentBy: { type: String, default: 'admin' },
    emailStatus: { type: String, default: 'sent' },
  },
  { _id: true }
);

const EnquiryLeadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Enquiry lead name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Enquiry lead email is required'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Enquiry lead phone is required'],
      trim: true,
    },
    countryCode: {
      type: String,
      default: '+61',
      trim: true,
    },
    company: {
      type: String,
      trim: true,
      default: '',
    },
    projectType: {
      type: String,
      trim: true,
      default: 'General',
    },
    customProjectType: {
      type: String,
      trim: true,
      default: '',
    },
    projectBudget: {
      type: String,
      trim: true,
      default: 'Not Specified',
    },
    aboutProject: {
      type: String,
      trim: true,
      default: '',
    },
    message: {
      type: String,
      required: [true, 'Project message is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['New', 'Contacted', 'Visited', 'Not Visited', 'Closed'],
      default: 'New',
    },
    emailHistory: [EmailHistorySchema],
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast querying & admin filters
EnquiryLeadSchema.index({ email: 1 });
EnquiryLeadSchema.index({ phone: 1 });
EnquiryLeadSchema.index({ status: 1 });
EnquiryLeadSchema.index({ projectType: 1 });
EnquiryLeadSchema.index({ createdAt: -1 });

export default mongoose.model('EnquiryLead', EnquiryLeadSchema);

