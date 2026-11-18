import mongoose from 'mongoose';

const websitePageSchema = new mongoose.Schema(
  {
    pageName: {
      type: String,
      required: [true, 'Page Name is required'],
      trim: true,
    },
    pageSlug: {
      type: String,
      required: [true, 'Page Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    pageUrl: {
      type: String,
      required: [true, 'Page URL is required'],
      trim: true,
      index: true,
    },
    pageType: {
      type: String,
      enum: [
        'home',
        'about',
        'services_listing',
        'service_detail',
        'case_studies_listing',
        'case_study_detail',
        'blogs_listing',
        'blog_detail',
        'newspaper',
        'gallery',
        'contact',
        'pricing',
        'custom',
      ],
      default: 'custom',
      index: true,
    },
    publishedStatus: {
      type: String,
      enum: ['published', 'draft', 'archived'],
      default: 'published',
      index: true,
    },
    internalLinkTarget: {
      type: Number,
      default: 5,
      min: 0,
    },
    externalLinkTarget: {
      type: Number,
      default: 2,
      min: 0,
    },
    metaTitle: {
      type: String,
      trim: true,
      default: '',
    },
    metaDescription: {
      type: String,
      trim: true,
      default: '',
    },
    h1Count: {
      type: Number,
      default: 1,
    },
    imagesCount: {
      type: Number,
      default: 0,
    },
    imagesWithAlt: {
      type: Number,
      default: 0,
    },
    wordCount: {
      type: Number,
      default: 450,
    },
    lastAuditedAt: {
      type: Date,
      default: null,
    },
    lastAuditScore: {
      type: Number,
      default: 0,
    },
    lastScoreCategory: {
      type: String,
      enum: ['Excellent', 'Good', 'Needs Improvement', 'Poor', 'Unscored'],
      default: 'Unscored',
    },
    isSystemPage: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const WebsitePage = mongoose.model('WebsitePage', websitePageSchema);
export default WebsitePage;

