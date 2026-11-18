import mongoose from 'mongoose';

const metricCardSchema = new mongoose.Schema(
  {
    value: { type: String, default: '' },
    label: { type: String, default: '' },
    description: { type: String, default: '' },
    icon: { type: String, default: 'TrendingUp' },
  },
  { _id: true }
);

const testimonialSchema = new mongoose.Schema(
  {
    quote: { type: String, default: '' },
    name: { type: String, default: '' },
    designation: { type: String, default: '' },
    photo: { type: String, default: '' },
  },
  { _id: false }
);

const beforeAfterSchema = new mongoose.Schema(
  {
    beforeImage: { type: String, default: '' },
    afterImage: { type: String, default: '' },
    beforeDescription: { type: String, default: '' },
    afterDescription: { type: String, default: '' },
  },
  { _id: false }
);

const challengeSolutionSchema = new mongoose.Schema(
  {
    challengeTitle: { type: String, default: '' },
    challengeDescription: { type: String, default: '' },
    solutionTitle: { type: String, default: '' },
    solutionDescription: { type: String, default: '' },
  },
  { _id: true }
);

const caseStudySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Case Study Title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    creationMode: {
      type: String,
      enum: ['manual', 'quick'],
      default: 'manual',
    },
    shortDescription: {
      type: String,
      trim: true,
      default: '',
    },
    projectDescription: {
      type: String,
      trim: true,
      default: '',
    },
    content: {
      type: String,
      default: '', // Used for Quick Create (Quill rich HTML)
    },
    clientName: {
      type: String,
      trim: true,
      default: '',
    },
    industry: {
      type: String,
      default: 'Technology',
      trim: true,
    },
    customIndustry: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      default: 'Website Development',
      trim: true,
    },
    customCategory: {
      type: String,
      default: '',
      trim: true,
    },
    featuredImage: {
      type: String,
      default: '/case-study/property.png',
    },
    additionalImages: {
      type: [String],
      default: [],
    },
    projectCompletionDate: {
      type: String,
      default: '',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    // Project Details
    clientOverview: { type: String, default: '' },
    projectOverview: { type: String, default: '' },
    projectType: { type: String, default: 'Website' },
    customProjectType: { type: String, default: '', trim: true },
    servicesProvided: { type: [String], default: [] },
    technologiesUsed: { type: [String], default: [] },
    projectDuration: { type: String, default: '' },
    projectUrl: { type: String, default: '' },
    clientLocation: { type: String, default: '' },
    // Structured Content (Manual Fill)
    challenge: { type: String, default: '' },
    solution: { type: String, default: '' },
    challengesAndSolutions: { type: [challengeSolutionSchema], default: [] },
    implementation: { type: String, default: '' },
    results: { type: String, default: '' },
    conclusion: { type: String, default: '' },
    gallery: { type: [String], default: [] },
    testimonial: { type: testimonialSchema, default: () => ({}) },
    // Results & Metrics
    metrics: { type: [metricCardSchema], default: [] },
    beforeAfter: { type: beforeAfterSchema, default: () => ({}) },
    showcaseTitle: { type: String, default: '', trim: true },
    showcaseImage: { type: String, default: '', trim: true },
    // SEO Legacy Top-Level Fields (Maintained for full backward compatibility)
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    metaKeywords: { type: [String], default: [] },
    canonicalUrl: { type: String, default: '' },
    ogImage: { type: String, default: '' },
    ogTitle: { type: String, default: '' },
    ogDescription: { type: String, default: '' },
    // Complete SEO Subdocument
    seo: {
      metaTitle: { type: String, trim: true, default: '' },
      metaDescription: { type: String, trim: true, default: '' },
      keywords: { type: [String], default: [] },
      slug: { type: String, trim: true, default: '' },
      canonicalUrl: { type: String, trim: true, default: '' },
      ogTitle: { type: String, trim: true, default: '' },
      ogDescription: { type: String, trim: true, default: '' },
      ogImage: { type: String, trim: true, default: '' },
    },
    // Lifecycle & Status
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate slug if missing & synchronize SEO fields
caseStudySchema.pre('validate', function () {
  if (!this.shortDescription && this.projectDescription) {
    this.shortDescription = this.projectDescription;
  }
  if (!this.projectDescription && this.shortDescription) {
    this.projectDescription = this.shortDescription;
  }
  if (!this.projectOverview && this.shortDescription) {
    this.projectOverview = this.shortDescription;
  }

  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Synchronize SEO subdocument with top-level fields
  const currentSlug = this.slug || (this.seo && this.seo.slug) || '';
  if (!this.slug && currentSlug) this.slug = currentSlug;

  const titleVal = this.title || '';
  const shortDescVal = this.shortDescription || '';
  const featImg = this.featuredImage || '/case-study/property.png';

  const s = this.seo || {};
  const metaTitleVal = (s.metaTitle && s.metaTitle.trim()) || (this.metaTitle && this.metaTitle.trim()) || (titleVal ? `${titleVal} | VR4Web Case Study` : '');
  const metaDescVal = (s.metaDescription && s.metaDescription.trim()) || (this.metaDescription && this.metaDescription.trim()) || (shortDescVal ? shortDescVal.slice(0, 160) : '');
  const keywordsVal = (Array.isArray(s.keywords) && s.keywords.length > 0)
    ? s.keywords
    : (Array.isArray(this.metaKeywords) && this.metaKeywords.length > 0)
    ? this.metaKeywords
    : ['Case Study', 'Digital Solutions', 'Software Development'];
  const canonicalVal = (s.canonicalUrl && s.canonicalUrl.trim()) || (this.canonicalUrl && this.canonicalUrl.trim()) || (currentSlug ? `https://vr4web.com/case-studies/${currentSlug}` : '');
  const ogTitleVal = (s.ogTitle && s.ogTitle.trim()) || (this.ogTitle && this.ogTitle.trim()) || metaTitleVal;
  const ogDescVal = (s.ogDescription && s.ogDescription.trim()) || (this.ogDescription && this.ogDescription.trim()) || metaDescVal;
  const ogImgVal = (s.ogImage && s.ogImage.trim()) || (this.ogImage && this.ogImage.trim()) || featImg;

  // Set top-level legacy fields
  this.metaTitle = metaTitleVal;
  this.metaDescription = metaDescVal;
  this.metaKeywords = keywordsVal;
  this.canonicalUrl = canonicalVal;
  this.ogTitle = ogTitleVal;
  this.ogDescription = ogDescVal;
  this.ogImage = ogImgVal;

  // Set SEO subdocument
  this.seo = {
    metaTitle: metaTitleVal,
    metaDescription: metaDescVal,
    keywords: keywordsVal,
    slug: currentSlug,
    canonicalUrl: canonicalVal,
    ogTitle: ogTitleVal,
    ogDescription: ogDescVal,
    ogImage: ogImgVal,
  };
});

caseStudySchema.index({ status: 1, createdAt: -1 });
caseStudySchema.index({ industry: 1, createdAt: -1 });
caseStudySchema.index({ category: 1, createdAt: -1 });

export const CaseStudy = mongoose.model('CaseStudy', caseStudySchema);
export default CaseStudy;

