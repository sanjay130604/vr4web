import mongoose from 'mongoose';

const featureItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Feature name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    isIncluded: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const pricingPackageSchema = new mongoose.Schema(
  {
    packageName: {
      type: String,
      required: [true, 'Package Name is required'],
      trim: true,
    },
    tagline: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be a non-negative number'],
      default: 0,
    },
    duration: {
      type: Number,
      default: 1,
      min: [1, 'Duration must be at least 1'],
    },
    durationType: {
      type: String,
      enum: ['Days', 'Months', 'Years', 'One Time', 'Custom'],
      default: 'Years',
    },
    buttonText: {
      type: String,
      default: 'Get Started',
      trim: true,
    },
    listingType: {
      type: String,
      enum: ['Standard', 'Featured', 'Premium'],
      default: 'Standard',
    },
    badge: {
      type: String,
      enum: ['None', 'Popular', 'Best Value', 'Recommended', 'Limited Offer', 'Custom'],
      default: 'None',
    },
    customBadgeText: {
      type: String,
      trim: true,
      default: '',
    },
    accentColor: {
      type: String,
      default: '#2563EB', // Primary Blue
      trim: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isHighlighted: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    category: {
      type: String,
      trim: true,
      default: 'Website Development Packages',
    },
    customCategory: {
      type: String,
      trim: true,
      default: '',
    },
    targetAudience: {
      type: String,
      trim: true,
      default: '',
    },
    features: {
      type: [featureItemSchema],
      default: [],
    },
    additionalNotes: {
      type: String,
      trim: true,
      default: '',
    },
    termsAndConditions: {
      type: String,
      trim: true,
      default: '',
    },
    offerExpiryDate: {
      type: Date,
      default: null,
    },
    ctaType: {
      type: String,
      enum: ['contact', 'enquiry', 'whatsapp', 'custom'],
      default: 'enquiry',
    },
    ctaLink: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Draft', 'Published'],
      default: 'Published',
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for fast public listing and ordering
pricingPackageSchema.index({ status: 1, isActive: 1, displayOrder: 1 });
pricingPackageSchema.index({ category: 1, displayOrder: 1 });

export const PricingPackage = mongoose.model('PricingPackage', pricingPackageSchema);
export default PricingPackage;

