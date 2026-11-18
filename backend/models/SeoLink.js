import mongoose from 'mongoose';

const seoLinkSchema = new mongoose.Schema(
  {
    sourcePageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WebsitePage',
      required: [true, 'Source Page is required'],
      index: true,
    },
    linkType: {
      type: String,
      enum: ['internal', 'external'],
      required: [true, 'Link Type is required'],
      index: true,
    },
    destinationPageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WebsitePage',
      default: null,
    },
    destinationUrl: {
      type: String,
      required: [true, 'Destination URL is required'],
      trim: true,
      index: true,
    },
    anchorText: {
      type: String,
      required: [true, 'Anchor Text is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    websiteName: {
      type: String,
      trim: true,
      default: '',
    },
    placement: {
      type: String,
      enum: [
        'header',
        'content_top',
        'content_body',
        'content_bottom',
        'sidebar',
        'footer',
        'related_links',
      ],
      default: 'content_body',
      index: true,
    },
    relAttribute: {
      type: String,
      enum: ['follow', 'nofollow', 'sponsored', 'ugc'],
      default: 'follow',
    },
    targetAttribute: {
      type: String,
      enum: ['_self', '_blank'],
      default: '_self',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
    validationStatus: {
      type: String,
      enum: ['working', 'broken', 'redirected', 'pending', 'temporary_error'],
      default: 'pending',
      index: true,
    },
    httpStatusCode: {
      type: Number,
      default: null,
    },
    lastCheckedAt: {
      type: Date,
      default: null,
    },
    validationError: {
      type: String,
      default: '',
    },
    isDuplicate: {
      type: Boolean,
      default: false,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

seoLinkSchema.index({ sourcePageId: 1, linkType: 1 });
seoLinkSchema.index({ sourcePageId: 1, destinationUrl: 1 });

const SeoLink = mongoose.model('SeoLink', seoLinkSchema);
export default SeoLink;

