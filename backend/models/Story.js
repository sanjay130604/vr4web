import mongoose from 'mongoose';

const storySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Story title is required'],
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    author: {
      type: String,
      default: 'VR4Web Editorial Team',
      trim: true,
    },
    category: {
      type: String,
      default: 'Digital Transformation',
      trim: true,
    },
    summary: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '/banner/3.jpg',
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
    },
    featured: {
      type: Boolean,
      default: false,
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

storySchema.pre('save', function () {
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
});

storySchema.index({ status: 1, createdAt: -1 });
storySchema.index({ category: 1, createdAt: -1 });
storySchema.index({ slug: 1 });

export const Story = mongoose.model('Story', storySchema);
export default Story;

