import Blog from '../models/Blog.js';

// Helper to generate a unique slug
export const generateUniqueSlug = async (title, currentId = null) => {
  let baseSlug = (title || 'blog')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!baseSlug) baseSlug = 'blog-' + Date.now();

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await Blog.findOne({ slug });
    if (!existing || (currentId && existing._id.toString() === currentId.toString())) {
      return slug;
    }
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

// Helper to estimate read time from word count
const calculateReadTime = (content = '', sections = [], summary = '') => {
  let text = `${summary} `;
  if (content) {
    text += content.replace(/<[^>]*>/g, ' ');
  }
  if (Array.isArray(sections)) {
    sections.forEach((sec) => {
      text += ` ${sec.heading || ''} ${sec.subheading || ''} ${sec.body || ''}`;
    });
  }
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
};

// Helper to normalize featuredImage & imageUrl
const normalizeImageFields = (body) => {
  const img =
    body.featuredImage?.url ||
    (typeof body.featuredImage === 'string' ? body.featuredImage : null) ||
    body.imageUrl ||
    '/blogs/blogs-banner.png';

  body.imageUrl = img;
  body.featuredImage = {
    url: img,
    alt: body.featuredImage?.alt || body.title || '',
  };
};

// Helper to normalize SEO and Social Media metadata
const normalizeSeoFields = (body, slug = '') => {
  const seo = body.seo || {};
  const currentSlug = slug || body.slug || seo.slug || '';

  const metaTitle =
    (seo.metaTitle && seo.metaTitle.trim()) ||
    (body.metaTitle && body.metaTitle.trim()) ||
    (body.title ? `${body.title.trim()} | VR4Web` : '');

  const metaDescription =
    (seo.metaDescription && seo.metaDescription.trim()) ||
    (body.metaDescription && body.metaDescription.trim()) ||
    (body.summary && body.summary.trim().slice(0, 160)) ||
    '';

  let metaKeywords = [];
  if (Array.isArray(seo.keywords) && seo.keywords.length > 0) {
    metaKeywords = seo.keywords;
  } else if (typeof seo.keywords === 'string') {
    metaKeywords = seo.keywords.split(',').map((k) => k.trim()).filter(Boolean);
  } else if (Array.isArray(body.metaKeywords) && body.metaKeywords.length > 0) {
    metaKeywords = body.metaKeywords;
  } else if (typeof body.metaKeywords === 'string') {
    metaKeywords = body.metaKeywords.split(',').map((k) => k.trim()).filter(Boolean);
  } else if (Array.isArray(body.tags) && body.tags.length > 0) {
    metaKeywords = body.tags;
  }

  const canonicalUrl =
    (seo.canonicalUrl && seo.canonicalUrl.trim()) ||
    (body.canonicalUrl && body.canonicalUrl.trim()) ||
    (currentSlug ? `https://vr4web.com/blog/${currentSlug}` : '');

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
    body.featuredImage?.url ||
    body.imageUrl ||
    '/blogs/blogs-banner.png';

  body.metaTitle = metaTitle;
  body.metaDescription = metaDescription;
  body.metaKeywords = metaKeywords;
  body.canonicalUrl = canonicalUrl;
  body.ogTitle = ogTitle;
  body.ogDescription = ogDescription;
  body.ogImage = ogImage;
  body.seo = {
    metaTitle,
    metaDescription,
    keywords: metaKeywords,
    slug: currentSlug,
    canonicalUrl,
    ogTitle,
    ogDescription,
    ogImage,
  };
};

/**
 * @desc Get all published blogs (Public)
 * @route GET /api/blogs
 */
export const getBlogs = async (req, res) => {
  try {
    const { search, category, tag, featured, page = 1, limit = 20 } = req.query;
    const query = { status: 'published' };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    if (category && category !== 'all') {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    if (tag && tag !== 'all') {
      query.tags = { $in: [new RegExp(`^${tag}$`, 'i')] };
    }

    if (featured === 'true' || featured === true) {
      query.isFeatured = true;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [total, blogs] = await Promise.all([
      Blog.countDocuments(query),
      Blog.find(query)
        .sort({ isFeatured: -1, publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      success: true,
      count: blogs.length,
      total,
      totalRecords: total,
      page: pageNum,
      currentPage: pageNum,
      pages: totalPages,
      totalPages,
      pagination: {
        currentPage: pageNum,
        page: pageNum,
        limit: limitNum,
        pageSize: limitNum,
        totalRecords: total,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      },
      data: blogs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get all blogs (Admin: includes drafts, published, archived)
 * @route GET /api/admin/blogs or GET /api/blogs/admin/all
 */
export const getAdminBlogs = async (req, res) => {
  try {
    const { search, status, category, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [total, blogs] = await Promise.all([
      Blog.countDocuments(query),
      Blog.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      success: true,
      count: blogs.length,
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
      data: blogs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get single blog by slug or ID (Public / Admin)
 * @route GET /api/blogs/:slug
 */
export const getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    let blog = null;

    // Check slug match first
    blog = await Blog.findOne({ slug: slug.toLowerCase() });

    // Fallback to ObjectId check if not found
    if (!blog && slug.match(/^[0-9a-fA-F]{24}$/)) {
      blog = await Blog.findById(slug);
    }

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog article not found' });
    }

    // If request is from public and status is not published
    // unless admin is requesting (check headers or allow public only for published)
    const isAdmin = Boolean(req.admin);
    if (!isAdmin && blog.status !== 'published') {
      return res.status(404).json({ success: false, message: 'Blog article is not published' });
    }

    // Increment views asynchronously
    Blog.findByIdAndUpdate(blog._id, { $inc: { views: 1 } }).exec();

    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get single blog by ID (Admin)
 * @route GET /api/admin/blogs/:id
 */
export const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    let blog = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      blog = await Blog.findById(id);
    }
    if (!blog) {
      blog = await Blog.findOne({ slug: id.toLowerCase() });
    }

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get related published blogs
 * @route GET /api/blogs/:slug/related
 */
export const getRelatedBlogs = async (req, res) => {
  try {
    const { slug } = req.params;
    const currentBlog = await Blog.findOne({
      $or: [{ slug: slug.toLowerCase() }, ...(slug.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: slug }] : [])],
    });

    const filter = {
      status: 'published',
      ...(currentBlog ? { _id: { $ne: currentBlog._id } } : {}),
    };

    let related = [];
    if (currentBlog?.category) {
      related = await Blog.find({
        ...filter,
        category: currentBlog.category,
      })
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(3);
    }

    // Fallback if not enough by category
    if (related.length < 3) {
      const existingIds = related.map((r) => r._id);
      if (currentBlog) existingIds.push(currentBlog._id);

      const additional = await Blog.find({
        status: 'published',
        _id: { $nin: existingIds },
      })
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(3 - related.length);

      related = [...related, ...additional];
    }

    res.status(200).json({ success: true, count: related.length, data: related });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Complete Mandatory Validation across all 4 sections for Published Blogs
 */
export const validateBlogForPublish = (body) => {
  const errors = {};

  const isQuick = body.contentType === 'quick';
  if (isQuick) {
    const rawContent = body.content ? body.content.replace(/<[^>]*>/g, '').trim() : '';
    if (!rawContent) {
      errors.content = 'Article Body Content is required';
    }
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  // 1. Basic Info
  if (!body.title || !body.title.trim()) {
    errors.title = 'Blog Title is required';
  }
  const slug = (body.slug || body.seo?.slug || '').trim();
  if (!slug) {
    errors.slug = 'URL Slug is required';
  }
  if (!body.category || !body.category.trim()) {
    errors.category = 'Blog Category is required';
  } else if (body.category === 'Other' && (!body.customCategory || !body.customCategory.trim())) {
    errors.customCategory = 'Custom Category is required when Other is selected';
  }
  if (!body.summary || !body.summary.trim()) {
    errors.summary = 'Short Description / Summary is required';
  }

  // 2. Featured Cover Photo
  const imgUrl = (
    body.featuredImage?.url ||
    (typeof body.featuredImage === 'string' ? body.featuredImage : null) ||
    body.imageUrl ||
    ''
  ).trim();
  if (!imgUrl) {
    errors.featuredImage = 'Featured Cover Photo is required';
  }

  // 3. Content Sections
  const sections = Array.isArray(body.sections) ? body.sections : [];
  if (sections.length === 0) {
    errors.sections = 'At least one content section is required';
  } else {
    sections.forEach((sec, idx) => {
      if (!sec.heading || !sec.heading.trim()) {
        errors[`section_heading_${idx}`] = `Section #${idx + 1} Heading is required`;
      }
      if (!sec.body || !sec.body.trim()) {
        errors[`section_body_${idx}`] = `Section #${idx + 1} Body Content is required`;
      }
    });
  }

  // 4. SEO & Social
  const metaTitle = (body.seo?.metaTitle || body.metaTitle || '').trim();
  if (!metaTitle) {
    errors.metaTitle = 'SEO Meta Title is required';
  } else if (metaTitle.length > 100) {
    errors.metaTitle = 'SEO Meta Title must be 100 characters or less';
  }

  const metaDescription = (body.seo?.metaDescription || body.metaDescription || '').trim();
  if (!metaDescription) {
    errors.metaDescription = 'SEO Meta Description is required';
  } else if (metaDescription.length > 320) {
    errors.metaDescription = 'SEO Meta Description must be 320 characters or less';
  }

  const canon = (body.seo?.canonicalUrl || body.canonicalUrl || '').trim();
  if (canon && !/^https?:\/\/.+/i.test(canon)) {
    errors.canonicalUrl = 'Canonical URL must be a valid absolute URL starting with http:// or https://';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * @desc Create new blog (Admin)
 * @route POST /api/admin/blogs or POST /api/blogs
 */
export const createBlog = async (req, res) => {
  try {
    const body = { ...req.body };
    const targetStatus = (body.status || 'published').toLowerCase();
    body.status = targetStatus;

    // Auto-populate missing fields for Quick Create mode
    if (body.contentType === 'quick') {
      const plainText = body.content ? body.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';
      if (!body.title || !body.title.trim()) {
        const headingMatch = body.content ? body.content.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i) : null;
        if (headingMatch && headingMatch[1]) {
          body.title = headingMatch[1].replace(/<[^>]*>/g, '').trim();
        } else if (plainText) {
          body.title = plainText.slice(0, 60).trim();
        } else {
          body.title = 'Quick Article';
        }
      }
      if (!body.category || !body.category.trim()) {
        body.category = 'Technology & AI';
      }
      if (!body.summary || !body.summary.trim()) {
        body.summary = plainText ? plainText.slice(0, 160).trim() : body.title;
      }
      const existingImg = (
        body.featuredImage?.url ||
        (typeof body.featuredImage === 'string' ? body.featuredImage : null) ||
        body.imageUrl ||
        ''
      ).trim();
      if (!existingImg) {
        const inlineImgMatch = body.content ? body.content.match(/<img[^>]+src="([^">]+)"/i) : null;
        const defaultCover = inlineImgMatch ? inlineImgMatch[1] : '/blogs/blogs-banner.png';
        body.featuredImage = { url: defaultCover, alt: body.title };
        body.imageUrl = defaultCover;
      }
      if (!body.seo || !body.seo.metaTitle) {
        body.seo = {
          metaTitle: body.title ? `${body.title.trim()} | VR4Web` : 'VR4Web Blog Article',
          metaDescription: body.summary || body.title,
          keywords: ['VR4Web', 'Blog', body.category || 'Technology'],
          canonicalUrl: '',
          ogTitle: body.title,
          ogDescription: body.summary || body.title,
          ogImage: body.imageUrl || '/blogs/blogs-banner.png',
        };
      }
    }

    // Category / Custom Category Handling
    if (body.category === 'Other' || !body.category) {
      if (body.customCategory && body.customCategory.trim()) {
        body.category = body.customCategory.trim();
        body.customCategory = body.customCategory.trim();
      } else if (targetStatus === 'published') {
        return res.status(400).json({ success: false, message: 'Custom Category is required when Other is selected' });
      }
    } else if (body.customCategory && body.customCategory.trim()) {
      body.category = body.customCategory.trim();
    }

    // If publishing, enforce mandatory 4-section validation
    if (targetStatus === 'published') {
      const validation = validateBlogForPublish(body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Please complete all mandatory fields across all sections before publishing',
          errors: validation.errors,
        });
      }
    } else {
      // Draft mode: only title is mandatory
      if (!body.title || !body.title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Blog Title is required to save as Draft',
          errors: { title: 'Blog Title is required' },
        });
      }
    }

    const explicitSlug = (body.slug || body.seo?.slug || '').trim().toLowerCase();
    if (explicitSlug) {
      const existing = await Blog.findOne({ slug: explicitSlug });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `The slug '${explicitSlug}' is already in use by another blog article. Please choose a unique slug.`,
        });
      }
      body.slug = explicitSlug;
    } else {
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

    // Normalize tags
    if (typeof body.tags === 'string') {
      body.tags = body.tags.split(',').map((t) => t.trim()).filter(Boolean);
    } else if (!Array.isArray(body.tags)) {
      body.tags = [];
    }

    // Normalize Image fields
    normalizeImageFields(body);

    // Normalize SEO fields
    normalizeSeoFields(body, body.slug);

    // Calculate Read Time if absent
    if (!body.readTime || !body.readTime.trim()) {
      body.readTime = calculateReadTime(body.content, body.sections, body.summary);
    }

    // Handle Publish Date (OPTIONAL - users can create without publish date)
    body.status = body.status || 'published';
    if (!body.publishedAt || body.publishedAt === '' || body.publishedAt === 'null') {
      body.publishedAt = body.status === 'published' ? new Date() : null;
    } else {
      const parsedDate = new Date(body.publishedAt);
      body.publishedAt = isNaN(parsedDate.getTime()) ? (body.status === 'published' ? new Date() : null) : parsedDate;
    }

    body.author = body.author || req.admin?.name || 'VR4Web Technology Team';

    const blog = await Blog.create(body);

    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      data: blog,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Update existing blog (Admin)
 * @route PUT /api/admin/blogs/:id or PUT /api/blogs/:id
 */
export const updateBlog = async (req, res) => {
  try {
    const body = { ...req.body };
    const targetStatus = (body.status || 'published').toLowerCase();
    if (body.status) {
      body.status = targetStatus;
    }

    // Auto-populate missing fields for Quick Create mode
    if (body.contentType === 'quick') {
      const plainText = body.content ? body.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';
      if (!body.title || !body.title.trim()) {
        const headingMatch = body.content ? body.content.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i) : null;
        if (headingMatch && headingMatch[1]) {
          body.title = headingMatch[1].replace(/<[^>]*>/g, '').trim();
        } else if (plainText) {
          body.title = plainText.slice(0, 60).trim();
        } else {
          body.title = 'Quick Article';
        }
      }
      if (!body.category || !body.category.trim()) {
        body.category = 'Technology & AI';
      }
      if (!body.summary || !body.summary.trim()) {
        body.summary = plainText ? plainText.slice(0, 160).trim() : body.title;
      }
      const existingImg = (
        body.featuredImage?.url ||
        (typeof body.featuredImage === 'string' ? body.featuredImage : null) ||
        body.imageUrl ||
        ''
      ).trim();
      if (!existingImg) {
        const inlineImgMatch = body.content ? body.content.match(/<img[^>]+src="([^">]+)"/i) : null;
        const defaultCover = inlineImgMatch ? inlineImgMatch[1] : '/blogs/blogs-banner.png';
        body.featuredImage = { url: defaultCover, alt: body.title };
        body.imageUrl = defaultCover;
      }
      if (!body.seo || !body.seo.metaTitle) {
        body.seo = {
          metaTitle: body.title ? `${body.title.trim()} | VR4Web` : 'VR4Web Blog Article',
          metaDescription: body.summary || body.title,
          keywords: ['VR4Web', 'Blog', body.category || 'Technology'],
          canonicalUrl: '',
          ogTitle: body.title,
          ogDescription: body.summary || body.title,
          ogImage: body.imageUrl || '/blogs/blogs-banner.png',
        };
      }
    }

    // Category / Custom Category Handling
    if (body.category === 'Other') {
      if (body.customCategory && body.customCategory.trim()) {
        body.category = body.customCategory.trim();
        body.customCategory = body.customCategory.trim();
      } else if (targetStatus === 'published') {
        return res.status(400).json({ success: false, message: 'Custom Category is required when Other is selected' });
      }
    } else if (body.customCategory && body.customCategory.trim()) {
      body.category = body.customCategory.trim();
    }

    const explicitSlug = (body.slug || body.seo?.slug || '').trim().toLowerCase();
    if (explicitSlug) {
      const existing = await Blog.findOne({
        slug: explicitSlug,
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `The slug '${explicitSlug}' is already in use by another blog article. Please choose a unique slug.`,
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

    const currentDoc = await Blog.findById(req.params.id);
    if (!currentDoc) {
      return res.status(404).json({ success: false, message: 'Blog article not found' });
    }

    const effectiveStatus = body.status !== undefined ? body.status : currentDoc.status;

    // Validate if status is or will be published
    if (effectiveStatus === 'published') {
      const mergedForValidation = {
        ...currentDoc.toObject(),
        ...body,
        featuredImage: body.featuredImage !== undefined ? body.featuredImage : currentDoc.featuredImage,
        sections: body.sections !== undefined ? body.sections : currentDoc.sections,
        seo: {
          ...(currentDoc.seo || {}),
          ...(body.seo || {}),
        },
      };

      const validation = validateBlogForPublish(mergedForValidation);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Please complete all mandatory fields across all sections before publishing',
          errors: validation.errors,
        });
      }
    } else {
      if (body.title !== undefined && !body.title.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Blog Title cannot be empty',
          errors: { title: 'Blog Title cannot be empty' },
        });
      }
    }

    const activeSlug = body.slug || currentDoc.slug;

    // Normalize tags
    if (typeof body.tags === 'string') {
      body.tags = body.tags.split(',').map((t) => t.trim()).filter(Boolean);
    }

    // Normalize Image fields
    normalizeImageFields(body);

    // Normalize SEO fields
    normalizeSeoFields(body, activeSlug);

    // Calculate Read Time if requested or empty
    if (!body.readTime || !body.readTime.trim()) {
      body.readTime = calculateReadTime(body.content, body.sections, body.summary);
    }

    // Handle Publish Date (OPTIONAL - safe parsing)
    if (body.publishedAt !== undefined) {
      if (!body.publishedAt || body.publishedAt === '' || body.publishedAt === 'null') {
        body.publishedAt = body.status === 'published' ? (currentDoc.publishedAt || new Date()) : null;
      } else {
        const parsedDate = new Date(body.publishedAt);
        body.publishedAt = isNaN(parsedDate.getTime()) ? (currentDoc.publishedAt || null) : parsedDate;
      }
    } else if (body.status === 'published' && !currentDoc.publishedAt) {
      body.publishedAt = new Date();
    }

    const blog = await Blog.findByIdAndUpdate(req.params.id, body, {
      returnDocument: 'after',
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Blog updated successfully',
      data: blog,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Delete blog (Admin)
 * @route DELETE /api/admin/blogs/:id or DELETE /api/blogs/:id
 */
export const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog article not found' });
    }
    res.status(200).json({ success: true, message: 'Blog article deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Duplicate blog as draft (Admin)
 * @route POST /api/admin/blogs/:id/duplicate or POST /api/blogs/:id/duplicate
 */
export const duplicateBlog = async (req, res) => {
  try {
    const original = await Blog.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ success: false, message: 'Original blog article not found' });
    }

    const data = original.toObject();
    delete data._id;
    delete data.createdAt;
    delete data.updatedAt;

    data.title = `${data.title} (Copy)`;
    data.slug = await generateUniqueSlug(`${original.slug || 'blog'}-copy`);
    data.status = 'draft';
    data.publishedAt = null;

    const copy = await Blog.create(data);

    res.status(201).json({
      success: true,
      message: 'Blog duplicated as Draft',
      data: copy,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Update blog status (Publish / Unpublish / Archive) (Admin)
 * @route PATCH /api/admin/blogs/:id/status or PATCH /api/blogs/:id/status
 */
export const updateBlogStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['draft', 'published', 'archived'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const currentDoc = await Blog.findById(req.params.id);
    if (!currentDoc) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    if (status === 'published') {
      const validation = validateBlogForPublish(currentDoc.toObject());
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Cannot publish blog: mandatory fields are incomplete',
          errors: validation.errors,
        });
      }
    }

    const update = { status };
    if (status === 'published') {
      update.publishedAt = currentDoc.publishedAt || new Date();
    }

    const blog = await Blog.findByIdAndUpdate(req.params.id, update, { returnDocument: 'after' });
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    res.status(200).json({
      success: true,
      message: `Blog status updated to ${status}`,
      data: blog,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Toggle / Update blog featured status (Admin)
 * @route PATCH /api/admin/blogs/:id/featured or PATCH /api/blogs/:id/featured
 */
export const updateBlogFeatured = async (req, res) => {
  try {
    const { isFeatured } = req.body;
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    blog.isFeatured = typeof isFeatured === 'boolean' ? isFeatured : !blog.isFeatured;
    await blog.save();

    res.status(200).json({
      success: true,
      message: `Blog is ${blog.isFeatured ? 'now Featured' : 'no longer Featured'}`,
      data: blog,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Upload Blog Image (Admin)
 * @route POST /api/admin/blogs/upload-image or POST /api/blogs/upload-image
 */
export const uploadBlogImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({
      success: true,
      fileUrl,
      filename: req.file.filename,
      message: 'Image uploaded successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
