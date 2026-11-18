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

const ContactLeadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Contact lead name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Contact lead email is required'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Contact lead phone is required'],
      trim: true,
    },
    phoneCode: {
      type: String,
      default: '+61',
      trim: true,
    },
    subject: {
      type: String,
      trim: true,
      default: 'General Website Enquiry',
    },
    customSubject: {
      type: String,
      trim: true,
      default: '',
    },
    message: {
      type: String,
      required: [true, 'Contact message is required'],
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
ContactLeadSchema.index({ email: 1 });
ContactLeadSchema.index({ phone: 1 });
ContactLeadSchema.index({ status: 1 });
ContactLeadSchema.index({ createdAt: -1 });

export default mongoose.model('ContactLead', ContactLeadSchema);

