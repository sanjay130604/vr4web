import mongoose from 'mongoose';

const newspaperSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Newspaper title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Newspaper description is required'],
      trim: true,
    },
    // Main image object
    image: {
      url: {
        type: String,
        default: '/white-paper.png',
        trim: true,
      },
      alt: {
        type: String,
        default: '',
        trim: true,
      },
    },
    // Backwards-compatible legacy image URL
    imageUrl: {
      type: String,
      default: '/white-paper.png',
      trim: true,
    },
    // PDF document object
    pdf: {
      url: {
        type: String,
        default: '',
        trim: true,
      },
      fileName: {
        type: String,
        default: '',
        trim: true,
      },
      fileSize: {
        type: Number,
        default: 0,
      },
    },
    // Backwards-compatible legacy PDF fields
    pdfUrl: {
      type: String,
      default: '',
      trim: true,
    },
    fileName: {
      type: String,
      default: '',
      trim: true,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    // Summary alias for description
    summary: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      default: 'Editorial Publication',
      trim: true,
    },
    customCategory: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
      index: true,
    },
    publishedAt: {
      type: Date,
    },
    downloads: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save synchronization hook
newspaperSchema.pre('save', function (next) {
  // Sync image.url and imageUrl
  if (this.image?.url && (!this.imageUrl || this.imageUrl === '/white-paper.png')) {
    this.imageUrl = this.image.url;
  } else if (this.imageUrl && (!this.image || !this.image.url)) {
    this.image = {
      url: this.imageUrl,
      alt: this.image?.alt || this.title || '',
    };
  }

  // Sync pdf.url and pdfUrl
  if (this.pdf?.url && !this.pdfUrl) {
    this.pdfUrl = this.pdf.url;
    this.fileName = this.pdf.fileName || this.fileName || '';
    this.fileSize = this.pdf.fileSize || this.fileSize || 0;
  } else if (this.pdfUrl && (!this.pdf || !this.pdf.url)) {
    this.pdf = {
      url: this.pdfUrl,
      fileName: this.fileName || 'document.pdf',
      fileSize: this.fileSize || 0,
    };
  }

  // Sync description and summary
  if (this.description && !this.summary) {
    this.summary = this.description;
  } else if (this.summary && !this.description) {
    this.description = this.summary;
  }

  // Set publishedAt when published
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  if (typeof next === 'function') next();
});

newspaperSchema.index({ status: 1, createdAt: -1 });
newspaperSchema.index({ publishedAt: -1 });

export const Newspaper = mongoose.model('Newspaper', newspaperSchema);
export default Newspaper;
