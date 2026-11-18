import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema(
  {
    heading: {
      type: String,
      trim: true,
      default: '',
    },
    subheading: {
      type: String,
      trim: true,
      default: '',
    },
    body: {
      type: String,
      default: '',
    },
    image: {
      url: { type: String, default: '' },
      alt: { type: String, default: '' },
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Blog title is required'],
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
    },
    category: {
      type: String,
      default: 'Technology & AI',
      trim: true,
    },
    customCategory: {
      type: String,
      default: '',
      trim: true,
    },
    author: {
      type: String,
      default: 'VR4Web Technology Team',
      trim: true,
    },
    readTime: {
      type: String,
      default: '5 min read',
      trim: true,
    },
    summary: {
      type: String,
      trim: true,
      default: '',
    },
    featuredImage: {
      url: {
        type: String,
        default: '/blogs/blogs-banner.png',
      },
      alt: {
        type: String,
        default: '',
      },
    },
    // Backwards-compatible legacy image field
    imageUrl: {
      type: String,
      default: '/blogs/blogs-banner.png',
      trim: true,
    },
    contentType: {
      type: String,
      enum: ['manual', 'quick'],
      default: 'manual',
    },
    // Rich text HTML used in Quick Create
    content: {
      type: String,
      default: '',
    },
    // Structured sections used in Manual Fill
    sections: {
      type: [sectionSchema],
      default: [],
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    // SEO & Social Media Metadata
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
    metaKeywords: [
      {
        type: String,
        trim: true,
      },
    ],
    canonicalUrl: {
      type: String,
      trim: true,
      default: '',
    },
    ogImage: {
      type: String,
      trim: true,
      default: '',
    },
    ogTitle: {
      type: String,
      trim: true,
      default: '',
    },
    ogDescription: {
      type: String,
      trim: true,
      default: '',
    },
    seo: {
      metaTitle: { type: String, trim: true, default: '' },
      metaDescription: { type: String, trim: true, default: '' },
      keywords: [{ type: String, trim: true }],
      slug: { type: String, trim: true, default: '' },
      canonicalUrl: { type: String, trim: true, default: '' },
      ogTitle: { type: String, trim: true, default: '' },
      ogDescription: { type: String, trim: true, default: '' },
      ogImage: { type: String, trim: true, default: '' },
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: null,
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

// Pre-save hook to synchronize slug and image URLs
blogSchema.pre('save', function (next) {
  // Sync slug
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Sync featuredImage and imageUrl
  if (this.featuredImage?.url && (!this.imageUrl || this.imageUrl === '/blogs/blogs-banner.png')) {
    this.imageUrl = this.featuredImage.url;
  } else if (this.imageUrl && (!this.featuredImage || !this.featuredImage.url)) {
    this.featuredImage = {
      url: this.imageUrl,
      alt: this.featuredImage?.alt || this.title || '',
    };
  }

  // Synchronize SEO & Social metadata
  if (!this.metaTitle && this.seo?.metaTitle) {
    this.metaTitle = this.seo.metaTitle;
  }
  if (!this.metaTitle && this.title) {
    this.metaTitle = `${this.title} | VR4Web`;
  }
  if (!this.metaDescription && this.seo?.metaDescription) {
    this.metaDescription = this.seo.metaDescription;
  }
  if (!this.metaDescription && this.summary) {
    this.metaDescription = this.summary.slice(0, 160);
  }
  if (!this.ogImage && this.seo?.ogImage) {
    this.ogImage = this.seo.ogImage;
  }
  if (!this.ogImage) {
    this.ogImage = this.featuredImage?.url || this.imageUrl || '/blogs/blogs-banner.png';
  }

  const currentSlug = this.slug || this.seo?.slug || '';
  const ogTitleVal = this.seo?.ogTitle || this.ogTitle || this.metaTitle || (this.title ? `${this.title} | VR4Web` : '');
  const ogDescVal = this.seo?.ogDescription || this.ogDescription || this.metaDescription || (this.summary ? this.summary.slice(0, 160) : '');
  const canonicalVal = this.seo?.canonicalUrl || this.canonicalUrl || (currentSlug ? `https://vr4web.com/blog/${currentSlug}` : '');

  this.ogTitle = ogTitleVal;
  this.ogDescription = ogDescVal;
  this.canonicalUrl = canonicalVal;

  this.seo = {
    metaTitle: this.metaTitle || '',
    metaDescription: this.metaDescription || '',
    keywords:
      Array.isArray(this.metaKeywords) && this.metaKeywords.length > 0
        ? this.metaKeywords
        : Array.isArray(this.seo?.keywords) && this.seo.keywords.length > 0
        ? this.seo.keywords
        : this.tags || [],
    slug: currentSlug,
    canonicalUrl: canonicalVal,
    ogTitle: ogTitleVal,
    ogDescription: ogDescVal,
    ogImage: this.ogImage || '',
  };

  if (typeof next === 'function') next();
});

blogSchema.index({ status: 1, createdAt: -1 });
blogSchema.index({ category: 1, createdAt: -1 });

export const Blog = mongoose.model('Blog', blogSchema);
export default Blog;
