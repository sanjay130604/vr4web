import fs from 'fs';
import path from 'path';
import CaseStudy from '../models/CaseStudy.js';

// Helper to generate unique slug
const generateUniqueSlug = async (title, currentId = null) => {
  let baseSlug = (title || 'case-study')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!baseSlug) baseSlug = 'case-study-' + Date.now();

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await CaseStudy.findOne({ slug });
    if (!existing || (currentId && existing._id.toString() === currentId.toString())) {
      return slug;
    }
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

/**
 * @desc Get all case studies (Admin)
 * @route GET /api/case-studies
 */
export const getAdminCaseStudies = async (req, res) => {
  try {
    const { search, industry, category, status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
      ];
    }
    if (industry && industry !== 'all') {
      query.industry = industry;
    }
    if (category && category !== 'all') {
      query.category = category;
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [total, caseStudies] = await Promise.all([
      CaseStudy.countDocuments(query),
      CaseStudy.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      success: true,
      count: caseStudies.length,
      data: caseStudies,
      caseStudies,
      total,
      totalRecords: total,
      page: pageNum,
      currentPage: pageNum,
      totalPages,
      pages: totalPages,
      pagination: {
        total,
        totalRecords: total,
        page: pageNum,
        currentPage: pageNum,
        pages: totalPages,
        totalPages,
        limit: limitNum,
        pageSize: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get single case study by ID (Admin)
 * @route GET /api/case-studies/:id
 */
export const getCaseStudyById = async (req, res) => {
  try {
    const caseStudy = await CaseStudy.findById(req.params.id);
    if (!caseStudy) {
      return res.status(404).json({ success: false, message: 'Case study not found' });
    }
    res.status(200).json({ success: true, data: caseStudy });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper to normalize SEO fields for Case Study
const normalizeCaseStudySeo = (body, slug) => {
  const seo = body.seo || {};
  const metaTitle =
    (seo.metaTitle && seo.metaTitle.trim()) ||
    (body.metaTitle && body.metaTitle.trim()) ||
    (body.title ? `${body.title.trim()} | VR4Web Case Study` : '');

  const metaDescription =
    (seo.metaDescription && seo.metaDescription.trim()) ||
    (body.metaDescription && body.metaDescription.trim()) ||
    (body.shortDescription && body.shortDescription.trim().slice(0, 160)) ||
    '';

  let keywords = [];
  if (Array.isArray(seo.keywords) && seo.keywords.length > 0) {
    keywords = seo.keywords;
  } else if (typeof seo.keywords === 'string') {
    keywords = seo.keywords.split(',').map((k) => k.trim()).filter(Boolean);
  } else if (Array.isArray(body.metaKeywords) && body.metaKeywords.length > 0) {
    keywords = body.metaKeywords;
  } else if (typeof body.metaKeywords === 'string') {
    keywords = body.metaKeywords.split(',').map((k) => k.trim()).filter(Boolean);
  } else {
    keywords = ['Case Study', 'Digital Solutions', 'Software Development'];
  }

  const canonicalUrl =
    (seo.canonicalUrl && seo.canonicalUrl.trim()) ||
    (body.canonicalUrl && body.canonicalUrl.trim()) ||
    (slug ? `https://vr4web.com/case-studies/${slug}` : '');

  const ogTitle =
    (seo.ogTitle && seo.ogTitle.trim()) ||
    (body.ogTitle && body.ogTitle.trim()) ||
    metaTitle;

  const ogDescription =
    (seo.ogDescription && seo.ogDescription.trim()) ||
    (body.ogDescription && body.ogDescription.trim()) ||
    metaDescription;

  const ogImage =
    (seo.ogImage && seo.ogImage.trim()) ||
    (body.ogImage && body.ogImage.trim()) ||
    body.featuredImage ||
    '/case-study/property.png';

  body.metaTitle = metaTitle;
  body.metaDescription = metaDescription;
  body.metaKeywords = keywords;
  body.canonicalUrl = canonicalUrl;
  body.ogTitle = ogTitle;
  body.ogDescription = ogDescription;
  body.ogImage = ogImage;

  body.seo = {
    metaTitle,
    metaDescription,
    keywords,
    slug,
    canonicalUrl,
    ogTitle,
    ogDescription,
    ogImage,
  };
};

// Helper to ensure challenge & solution array and legacy string fields stay in sync
const syncChallengeSolutionData = (body) => {
  if (Array.isArray(body.challengesAndSolutions) && body.challengesAndSolutions.length > 0) {
    if (!body.challenge && body.challengesAndSolutions[0]?.challengeDescription) {
      body.challenge = body.challengesAndSolutions[0].challengeDescription;
    }
    if (!body.solution && body.challengesAndSolutions[0]?.solutionDescription) {
      body.solution = body.challengesAndSolutions[0].solutionDescription;
    }
  } else if (body.challenge || body.solution) {
    body.challengesAndSolutions = [
      {
        challengeTitle: 'The Business Challenge',
        challengeDescription: body.challenge || '',
        solutionTitle: 'Our Strategic Approach',
        solutionDescription: body.solution || '',
      },
    ];
  }
};

/**
 * Complete Mandatory Validation across all 5 sections for Published Case Studies
 */
export const validateCaseStudyForPublish = (body) => {
  const errors = {};

  // 1. Basic Info
  if (!body.title || !body.title.trim()) {
    errors.title = 'Case Study Title is required';
  }
  const slug = (body.slug || body.seo?.slug || '').trim();
  if (!slug) {
    errors.slug = 'Slug is required';
  }
  if (!body.clientName || !body.clientName.trim()) {
    errors.clientName = 'Client Name is required';
  }
  if (!body.category || !body.category.trim()) {
    errors.category = 'Category is required';
  } else if (body.category === 'Other' && (!body.customCategory || !body.customCategory.trim())) {
    errors.customCategory = 'Custom Category is required when Other is selected';
  }
  if (body.creationMode === 'quick') {
    if (!body.content || !body.content.trim() || body.content.replace(/<[^>]*>/g, '').trim().length === 0) {
      errors.content = 'Rich text content is required';
    }
  } else {
    const desc = (body.shortDescription || body.projectDescription || '').trim();
    if (!desc) {
      errors.shortDescription = 'Project Description is required';
    } else {
      body.shortDescription = desc;
      body.projectDescription = desc;
    }
  }
  if (!body.featuredImage || !body.featuredImage.trim()) {
    errors.featuredImage = 'Featured Cover Image is required';
  }
  // projectCompletionDate and isFeatured remain OPTIONAL

  // 2. Project Details (Optional fields with automatic fallbacks)
  if (!body.projectOverview || !body.projectOverview.trim()) {
    body.projectOverview = body.shortDescription?.trim() || body.projectDescription?.trim() || body.title?.trim() || '';
  }
  if (!body.clientOverview) {
    body.clientOverview = '';
  }
  if (body.projectType === 'Other' && (!body.customProjectType || !body.customProjectType.trim())) {
    errors.customProjectType = 'Custom Project Type is required when Other is selected';
  }
  if (body.industry === 'Other' && (!body.customIndustry || !body.customIndustry.trim())) {
    errors.customIndustry = 'Custom Industry is required when Other is selected';
  }
  if (body.projectUrl && body.projectUrl.trim() && !/^https?:\/\/.+/i.test(body.projectUrl.trim())) {
    errors.projectUrl = 'Project URL must be a valid URL starting with http:// or https://';
  }
  // projectDuration, clientLocation, servicesProvided, technologiesUsed are OPTIONAL

  // 3. Case Study Content (Optional for manual mode; validated only if partially entered)
  if (body.creationMode === 'quick') {
    if (!body.content || !body.content.trim() || body.content.replace(/<[^>]*>/g, '').trim().length === 0) {
      errors.content = 'Rich text content is required';
    }
  } else {
    const pairs = Array.isArray(body.challengesAndSolutions) ? body.challengesAndSolutions : [];
    pairs.forEach((pair, idx) => {
      const hasAny = pair.challengeTitle?.trim() || pair.challengeDescription?.trim() || pair.solutionTitle?.trim() || pair.solutionDescription?.trim();
      if (hasAny) {
        if (!pair.challengeTitle || !pair.challengeTitle.trim()) {
          errors[`challengeTitle_${idx}`] = `Challenge #${idx + 1} Title is required`;
        }
        if (!pair.challengeDescription || !pair.challengeDescription.trim()) {
          errors[`challengeDescription_${idx}`] = `Challenge #${idx + 1} Description is required`;
        }
        if (!pair.solutionTitle || !pair.solutionTitle.trim()) {
          errors[`solutionTitle_${idx}`] = `Solution #${idx + 1} Title is required`;
        }
        if (!pair.solutionDescription || !pair.solutionDescription.trim()) {
          errors[`solutionDescription_${idx}`] = `Solution #${idx + 1} Description is required`;
        }
      }
    });
  }

  // 4. Results & Metrics (Optional; validated only if partially entered)
  if (body.creationMode !== 'quick') {
    const metrics = Array.isArray(body.metrics) ? body.metrics : [];
    metrics.forEach((m, idx) => {
      const hasAny = m.value?.trim() || m.label?.trim() || m.description?.trim();
      if (hasAny) {
        if (!m.value || !m.value.trim()) {
          errors[`metric_value_${idx}`] = `Metric #${idx + 1} Value is required`;
        }
        if (!m.label || !m.label.trim()) {
          errors[`metric_label_${idx}`] = `Metric #${idx + 1} Label is required`;
        }
      }
    });
    // beforeAfter remains OPTIONAL
  }

  // 5. SEO & Social
  const metaTitle = (body.seo?.metaTitle || body.metaTitle || '').trim();
  if (!metaTitle) {
    errors.metaTitle = 'SEO Meta Title is required';
  } else if (metaTitle.length > 100) {
    errors.metaTitle = 'SEO Meta Title cannot exceed 100 characters';
  }

  const metaDesc = (body.seo?.metaDescription || body.metaDescription || '').trim();
  if (!metaDesc) {
    errors.metaDescription = 'SEO Meta Description is required';
  } else if (metaDesc.length > 320) {
    errors.metaDescription = 'SEO Meta Description cannot exceed 320 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * @desc Create case study
 * @route POST /api/case-studies
 */
export const createCaseStudy = async (req, res) => {
  try {
    const body = { ...req.body };

    // Category / Other Custom Category Handling
    if (body.category === 'Other' || !body.category) {
      if (body.customCategory && body.customCategory.trim()) {
        body.category = body.customCategory.trim();
        body.customCategory = body.customCategory.trim();
      } else if (body.status === 'published') {
        return res.status(400).json({ success: false, message: 'Custom Category is required when Other is selected' });
      }
    } else if (body.customCategory && body.customCategory.trim()) {
      body.category = body.customCategory.trim();
    }

    // Industry / Other Custom Industry Handling
    if (body.industry === 'Other' || !body.industry) {
      if (body.customIndustry && body.customIndustry.trim()) {
        body.industry = body.customIndustry.trim();
        body.customIndustry = body.customIndustry.trim();
      } else if (body.status === 'published' && body.industry === 'Other') {
        return res.status(400).json({ success: false, message: 'Custom Industry is required when Other is selected' });
      }
    } else if (body.customIndustry && body.customIndustry.trim()) {
      body.industry = body.customIndustry.trim();
    }

    // Project Type / Other Custom Project Type Handling
    if (body.projectType === 'Other' || !body.projectType) {
      if (body.customProjectType && body.customProjectType.trim()) {
        body.projectType = body.customProjectType.trim();
        body.customProjectType = body.customProjectType.trim();
      } else if (body.status === 'published' && body.projectType === 'Other') {
        return res.status(400).json({ success: false, message: 'Custom Project Type is required when Other is selected' });
      }
    } else if (body.customProjectType && body.customProjectType.trim()) {
      body.projectType = body.customProjectType.trim();
    }

    // Optional fields safety
    body.projectCompletionDate = body.projectCompletionDate ? body.projectCompletionDate.trim() : '';

    syncChallengeSolutionData(body);

    const explicitSlug = (body.slug || body.seo?.slug || '').trim().toLowerCase();
    if (explicitSlug) {
      // Validate unique slug
      const existing = await CaseStudy.findOne({ slug: explicitSlug });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `The slug '${explicitSlug}' is already in use by another case study. Please choose a unique slug.`,
        });
      }
      body.slug = explicitSlug;
    } else if (body.title && body.title.trim()) {
      body.slug = await generateUniqueSlug(body.title);
    }

    // Validate canonical URL format if provided
    const canonUrl = (body.canonicalUrl || body.seo?.canonicalUrl || '').trim();
    if (canonUrl && !/^https?:\/\/.+/i.test(canonUrl)) {
      return res.status(400).json({
        success: false,
        message: 'Canonical URL must be a valid absolute URL starting with http:// or https://',
      });
    }

    normalizeCaseStudySeo(body, body.slug);

    // Validation according to target status
    if (body.status === 'published') {
      const validation = validateCaseStudyForPublish(body);
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        return res.status(400).json({
          success: false,
          message: `Validation failed: ${firstError}`,
          errors: validation.errors,
        });
      }
      if (!body.publishedAt) {
        body.publishedAt = new Date();
      }
    } else {
      // Draft mode: Only title is required
      if (!body.title || !body.title.trim()) {
        return res.status(400).json({ success: false, message: 'Case Study Title is required to save a draft' });
      }
    }

    const caseStudy = await CaseStudy.create(body);
    res.status(201).json({
      success: true,
      message: `Case study ${body.status === 'published' ? 'published' : 'saved as draft'} successfully`,
      data: caseStudy,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Update case study
 * @route PUT /api/case-studies/:id
 */
export const updateCaseStudy = async (req, res) => {
  try {
    const currentDoc = await CaseStudy.findById(req.params.id);
    if (!currentDoc) {
      return res.status(404).json({ success: false, message: 'Case study not found' });
    }

    const body = { ...req.body };

    // Category / Other Custom Category Handling
    if (body.category === 'Other') {
      if (body.customCategory && body.customCategory.trim()) {
        body.category = body.customCategory.trim();
        body.customCategory = body.customCategory.trim();
      } else if (body.status === 'published') {
        return res.status(400).json({ success: false, message: 'Custom Category is required when Other is selected' });
      }
    } else if (body.customCategory && body.customCategory.trim()) {
      body.category = body.customCategory.trim();
    }

    // Industry / Other Custom Industry Handling
    if (body.industry === 'Other') {
      if (body.customIndustry && body.customIndustry.trim()) {
        body.industry = body.customIndustry.trim();
        body.customIndustry = body.customIndustry.trim();
      } else if (body.status === 'published') {
        return res.status(400).json({ success: false, message: 'Custom Industry is required when Other is selected' });
      }
    } else if (body.customIndustry && body.customIndustry.trim()) {
      body.industry = body.customIndustry.trim();
    }

    // Project Type / Other Custom Project Type Handling
    if (body.projectType === 'Other') {
      if (body.customProjectType && body.customProjectType.trim()) {
        body.projectType = body.customProjectType.trim();
        body.customProjectType = body.customProjectType.trim();
      } else if (body.status === 'published') {
        return res.status(400).json({ success: false, message: 'Custom Project Type is required when Other is selected' });
      }
    } else if (body.customProjectType && body.customProjectType.trim()) {
      body.projectType = body.customProjectType.trim();
    }

    // Optional fields safety
    if (body.projectCompletionDate !== undefined) {
      body.projectCompletionDate = body.projectCompletionDate ? body.projectCompletionDate.trim() : '';
    }

    syncChallengeSolutionData(body);

    const explicitSlug = (body.slug || body.seo?.slug || '').trim().toLowerCase();
    if (explicitSlug) {
      const existing = await CaseStudy.findOne({
        slug: explicitSlug,
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `The slug '${explicitSlug}' is already in use by another case study. Please choose a unique slug.`,
        });
      }
      body.slug = explicitSlug;
    }

    // Validate canonical URL format if provided
    const canonUrl = (body.canonicalUrl || body.seo?.canonicalUrl || '').trim();
    if (canonUrl && !/^https?:\/\/.+/i.test(canonUrl)) {
      return res.status(400).json({
        success: false,
        message: 'Canonical URL must be a valid absolute URL starting with http:// or https://',
      });
    }

    const activeSlug = body.slug || currentDoc.slug;
    normalizeCaseStudySeo(body, activeSlug);

    const targetStatus = body.status !== undefined ? body.status : currentDoc.status;
    if (targetStatus === 'published') {
      const merged = { ...currentDoc.toObject(), ...body };
      const validation = validateCaseStudyForPublish(merged);
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        return res.status(400).json({
          success: false,
          message: `Validation failed: ${firstError}`,
          errors: validation.errors,
        });
      }
      if (!currentDoc.publishedAt && !body.publishedAt) {
        body.publishedAt = new Date();
      }
    } else {
      if (body.title !== undefined && !body.title.trim()) {
        return res.status(400).json({ success: false, message: 'Case Study Title cannot be empty' });
      }
    }

    const caseStudy = await CaseStudy.findByIdAndUpdate(req.params.id, body, {
      returnDocument: 'after',
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Case study updated successfully',
      data: caseStudy,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Publish case study
 * @route PATCH /api/case-studies/:id/publish
 */
export const publishCaseStudy = async (req, res) => {
  try {
    const existing = await CaseStudy.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Case study not found' });
    }

    const validation = validateCaseStudyForPublish(existing.toObject());
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      return res.status(400).json({
        success: false,
        message: `Cannot publish: ${firstError}. Please edit and complete all 5 sections before publishing.`,
        errors: validation.errors,
      });
    }

    existing.status = 'published';
    if (!existing.publishedAt) {
      existing.publishedAt = new Date();
    }
    await existing.save();

    res.status(200).json({
      success: true,
      message: `"${existing.title}" published live successfully!`,
      data: existing,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Unpublish case study
 * @route PATCH /api/case-studies/:id/unpublish
 */
export const unpublishCaseStudy = async (req, res) => {
  try {
    const caseStudy = await CaseStudy.findByIdAndUpdate(
      req.params.id,
      { status: 'draft' },
      { returnDocument: 'after' }
    );
    if (!caseStudy) {
      return res.status(404).json({ success: false, message: 'Case study not found' });
    }
    res.status(200).json({ success: true, message: 'Case study unpublished (Draft)', data: caseStudy });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Delete case study
 * @route DELETE /api/case-studies/:id
 */
export const deleteCaseStudy = async (req, res) => {
  try {
    const caseStudy = await CaseStudy.findByIdAndDelete(req.params.id);
    if (!caseStudy) {
      return res.status(404).json({ success: false, message: 'Case study not found' });
    }
    res.status(200).json({ success: true, message: 'Case study permanently deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Duplicate case study
 * @route POST /api/case-studies/:id/duplicate
 */
export const duplicateCaseStudy = async (req, res) => {
  try {
    const original = await CaseStudy.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ success: false, message: 'Original case study not found' });
    }

    const data = original.toObject();
    delete data._id;
    delete data.createdAt;
    delete data.updatedAt;

    data.title = `${data.title} (Copy)`;
    data.slug = await generateUniqueSlug(`${original.slug}-copy`);
    data.status = 'draft';
    data.publishedAt = null;

    const copy = await CaseStudy.create(data);
    res.status(201).json({
      success: true,
      message: 'Case study duplicated as Draft',
      data: copy,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Upload image
 * @route POST /api/case-studies/upload-image
 */
export const uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a valid image file' });
  }

  // Construct served path
  const fileUrl = `/uploads/${req.file.filename}`;
  res.status(200).json({
    success: true,
    fileUrl,
    filename: req.file.filename,
    message: 'Image uploaded successfully',
  });
};

/**
 * @desc Public Get all published case studies
 * @route GET /api/public/case-studies
 */
export const getPublicCaseStudies = async (req, res) => {
  try {
    const caseStudies = await CaseStudy.find({ status: 'published' }).sort({
      isFeatured: -1,
      publishedAt: -1,
      createdAt: -1,
    });
    res.status(200).json({ success: true, count: caseStudies.length, data: caseStudies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Public Get single published case study by slug or id
 * @route GET /api/public/case-studies/:slug
 */
export const getPublicCaseStudyBySlug = async (req, res) => {
  try {
    const param = req.params.slug;
    let caseStudy = null;

    // Try finding by slug first
    caseStudy = await CaseStudy.findOne({ slug: param, status: 'published' });

    // If not found and param is valid ObjectId, try by id
    if (!caseStudy && param.match(/^[0-9a-fA-F]{24}$/)) {
      caseStudy = await CaseStudy.findOne({ _id: param, status: 'published' });
    }

    if (!caseStudy) {
      return res.status(404).json({ success: false, message: 'Case study not found or not published' });
    }

    // Increment views asynchronously
    CaseStudy.findByIdAndUpdate(caseStudy._id, { $inc: { views: 1 } }).exec();

    // Fetch related published case studies (excluding current)
    const related = await CaseStudy.find({
      _id: { $ne: caseStudy._id },
      status: 'published',
    })
      .limit(3)
      .select('title slug shortDescription featuredImage industry category');

    res.status(200).json({
      success: true,
      data: caseStudy,
      related,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

