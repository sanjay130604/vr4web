import mongoose from 'mongoose';

const gallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Image title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    // Backward compatibility: caption synced with description
    caption: {
      type: String,
      trim: true,
      default: '',
    },
    image: {
      url: {
        type: String,
        required: [true, 'Image URL is required'],
        trim: true,
      },
      alt: {
        type: String,
        trim: true,
        default: '',
      },
      width: {
        type: Number,
        default: null,
      },
      height: {
        type: Number,
        default: null,
      },
    },
    // Backward compatibility: imageUrl synced with image.url
    imageUrl: {
      type: String,
      trim: true,
      default: '',
    },
    category: {
      type: String,
      default: 'General',
      trim: true,
    },
    customCategory: {
      type: String,
      default: '',
      trim: true,
    },
    aspectRatio: {
      type: String,
      default: '16/9',
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'draft', 'published', 'visible', 'hidden'],
      default: 'active',
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: synchronize image.url and imageUrl, caption and description, order and displayOrder, status and publishedAt
gallerySchema.pre('save', function (next) {
  // Normalize image and imageUrl
  if (this.image?.url && (!this.imageUrl || this.imageUrl === '')) {
    this.imageUrl = this.image.url;
  } else if (this.imageUrl && (!this.image || !this.image.url)) {
    this.image = {
      url: this.imageUrl,
      alt: this.image?.alt || this.title || '',
      width: this.image?.width || null,
      height: this.image?.height || null,
    };
  }

  // Normalize description and caption
  if (this.description && !this.caption) {
    this.caption = this.description;
  } else if (this.caption && !this.description) {
    this.description = this.caption;
  }

  // Sync displayOrder and order
  if (this.displayOrder !== undefined && (this.order === undefined || this.order === 0)) {
    this.order = this.displayOrder;
  } else if (this.order !== undefined && (this.displayOrder === undefined || this.displayOrder === 0)) {
    this.displayOrder = this.order;
  }

  // Map status aliases to canonical values
  if (this.status === 'visible' || this.status === 'active') {
    this.status = 'published';
  } else if (this.status === 'hidden' || this.status === 'inactive') {
    this.status = 'draft';
  }

  // Set publishedAt if published and not set
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  if (typeof next === 'function') next();
});

gallerySchema.index({ isDeleted: 1, status: 1, displayOrder: 1, createdAt: -1 });
gallerySchema.index({ isDeleted: 1, isFeatured: 1 });
gallerySchema.index({ isDeleted: 1, category: 1 });

export const Gallery = mongoose.model('Gallery', gallerySchema);
export default Gallery;
