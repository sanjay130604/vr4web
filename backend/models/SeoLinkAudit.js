import mongoose from 'mongoose';

const factorScoreSchema = new mongoose.Schema(
  {
    score: { type: Number, default: 0 },
    maxScore: { type: Number, required: true },
    feedback: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pass', 'warning', 'fail'],
      default: 'pass',
    },
  },
  { _id: false }
);

const seoLinkAuditSchema = new mongoose.Schema(
  {
    pageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WebsitePage',
      required: true,
      index: true,
    },
    totalInternalLinks: { type: Number, default: 0 },
    totalExternalLinks: { type: Number, default: 0 },
    activeInternalLinks: { type: Number, default: 0 },
    activeExternalLinks: { type: Number, default: 0 },
    brokenLinks: { type: Number, default: 0 },
    duplicateLinks: { type: Number, default: 0 },
    score: { type: Number, min: 0, max: 100, default: 0 },
    scoreCategory: {
      type: String,
      enum: ['Excellent', 'Good', 'Needs Improvement', 'Poor'],
      default: 'Needs Improvement',
    },
    factors: {
      internalLinkCoverage: factorScoreSchema,
      externalLinkQuality: factorScoreSchema,
      metaTitle: factorScoreSchema,
      metaDescription: factorScoreSchema,
      headingStructure: factorScoreSchema,
      imageAltText: factorScoreSchema,
      urlStructure: factorScoreSchema,
      contentQuality: factorScoreSchema,
    },
    recommendations: {
      type: [String],
      default: [],
    },
    analyzedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

seoLinkAuditSchema.index({ pageId: 1, analyzedAt: -1 });

const SeoLinkAudit = mongoose.model('SeoLinkAudit', seoLinkAuditSchema);
export default SeoLinkAudit;

