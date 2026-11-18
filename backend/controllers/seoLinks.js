import WebsitePage from '../models/WebsitePage.js';
import SeoLink from '../models/SeoLink.js';
import SeoLinkAudit from '../models/SeoLinkAudit.js';
import {
  validateUrlDestination,
  calculatePageSeoScore,
  syncWebsitePages,
} from '../services/seoLinkAuditEngine.js';

/**
 * @desc Get all registered website pages with pagination, search, filter and live link metrics
 * @route GET /api/seo-links/pages
 */
export const getPages = async (req, res) => {
  try {
    const {
      search = '',
      pageType = 'all',
      scoreCategory = 'all',
      status = 'all',
      sortBy = 'pageName',
      sortOrder = 'asc',
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { pageName: searchRegex },
        { pageSlug: searchRegex },
        { pageUrl: searchRegex },
      ];
    }

    if (pageType !== 'all') {
      query.pageType = pageType;
    }

    if (status !== 'all') {
      query.publishedStatus = status;
    }

    if (scoreCategory !== 'all') {
      query.lastScoreCategory = scoreCategory;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const sortOption = {};
    if (sortBy === 'score') {
      sortOption.lastAuditScore = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'updatedAt') {
      sortOption.updatedAt = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortOption.pageName = sortOrder === 'desc' ? -1 : 1;
    }

    const [total, pages] = await Promise.all([
      WebsitePage.countDocuments(query),
      WebsitePage.find(query).sort(sortOption).skip(skip).limit(limitNum).lean(),
    ]);

    // Enhance each page with dynamic link counts from SeoLink
    const pageIds = pages.map((p) => p._id);
    const linkCounts = await SeoLink.aggregate([
      { $match: { sourcePageId: { $in: pageIds } } },
      {
        $group: {
          _id: { sourcePageId: '$sourcePageId', linkType: '$linkType', status: '$status', validationStatus: '$validationStatus' },
          count: { $sum: 1 },
        },
      },
    ]);

    const enrichedPages = pages.map((p) => {
      const pid = p._id.toString();
      let internalCount = 0;
      let externalCount = 0;
      let activeInternalCount = 0;
      let activeExternalCount = 0;
      let brokenCount = 0;

      linkCounts.forEach((c) => {
        if (c._id.sourcePageId.toString() === pid) {
          if (c._id.linkType === 'internal') {
            internalCount += c.count;
            if (c._id.status === 'active') activeInternalCount += c.count;
          } else {
            externalCount += c.count;
            if (c._id.status === 'active') activeExternalCount += c.count;
          }
          if (c._id.validationStatus === 'broken') {
            brokenCount += c.count;
          }
        }
      });

      return {
        ...p,
        internalLinksCount: internalCount,
        externalLinksCount: externalCount,
        activeInternalCount,
        activeExternalCount,
        brokenLinksCount: brokenCount,
        healthStatus:
          brokenCount > 0
            ? 'Has Broken Links'
            : p.lastAuditScore >= 80
            ? 'Healthy'
            : 'Needs Review',
      };
    });

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      success: true,
      data: enrichedPages,
      pages: enrichedPages,
      total,
      totalRecords: total,
      page: pageNum,
      currentPage: pageNum,
      totalPages,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get page details with all internal and external links + latest audit
 * @route GET /api/seo-links/pages/:id
 */
export const getPageById = async (req, res) => {
  try {
    const page = await WebsitePage.findById(req.params.id);
    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }

    const [links, latestAudit] = await Promise.all([
      SeoLink.find({ sourcePageId: page._id })
        .populate('destinationPageId', 'pageName pageUrl publishedStatus')
        .sort({ order: 1, createdAt: -1 })
        .lean(),
      SeoLinkAudit.findOne({ pageId: page._id }).sort({ analyzedAt: -1 }).lean(),
    ]);

    const internalLinks = links.filter((l) => l.linkType === 'internal');
    const externalLinks = links.filter((l) => l.linkType === 'external');

    res.status(200).json({
      success: true,
      data: {
        page,
        internalLinks,
        externalLinks,
        links,
        latestAudit,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Update page link targets and metadata
 * @route PUT /api/seo-links/pages/:id
 */
export const updatePageTargets = async (req, res) => {
  try {
    const {
      internalLinkTarget,
      externalLinkTarget,
      metaTitle,
      metaDescription,
      h1Count,
      wordCount,
      imagesCount,
      imagesWithAlt,
      publishedStatus,
    } = req.body;

    const page = await WebsitePage.findById(req.params.id);
    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }

    if (internalLinkTarget !== undefined) page.internalLinkTarget = Math.max(0, parseInt(internalLinkTarget, 10));
    if (externalLinkTarget !== undefined) page.externalLinkTarget = Math.max(0, parseInt(externalLinkTarget, 10));
    if (metaTitle !== undefined) page.metaTitle = metaTitle.trim();
    if (metaDescription !== undefined) page.metaDescription = metaDescription.trim();
    if (h1Count !== undefined) page.h1Count = parseInt(h1Count, 10);
    if (wordCount !== undefined) page.wordCount = parseInt(wordCount, 10);
    if (imagesCount !== undefined) page.imagesCount = parseInt(imagesCount, 10);
    if (imagesWithAlt !== undefined) page.imagesWithAlt = parseInt(imagesWithAlt, 10);
    if (publishedStatus !== undefined) page.publishedStatus = publishedStatus;

    await page.save();

    // Re-audit page
    const links = await SeoLink.find({ sourcePageId: page._id });
    const audit = calculatePageSeoScore(page, links);
    page.lastAuditScore = audit.score;
    page.lastScoreCategory = audit.scoreCategory;
    page.lastAuditedAt = new Date();
    await page.save();

    res.status(200).json({
      success: true,
      message: 'Page targets and SEO properties updated successfully',
      data: page,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Auto-discover and sync all website pages
 * @route POST /api/seo-links/pages/sync
 */
export const triggerSyncPages = async (req, res) => {
  try {
    await syncWebsitePages();
    const count = await WebsitePage.countDocuments();
    res.status(200).json({
      success: true,
      message: `Successfully synchronized ${count} website pages`,
      count,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get comprehensive SEO Link Analytics
 * @route GET /api/seo-links/analytics
 */
export const getAnalytics = async (req, res) => {
  try {
    const [
      totalPages,
      totalInternalLinks,
      totalExternalLinks,
      brokenLinksCount,
      duplicateLinksCount,
      pages,
      brokenLinks,
      recentLinks,
    ] = await Promise.all([
      WebsitePage.countDocuments(),
      SeoLink.countDocuments({ linkType: 'internal' }),
      SeoLink.countDocuments({ linkType: 'external' }),
      SeoLink.countDocuments({ validationStatus: 'broken' }),
      SeoLink.countDocuments({ isDuplicate: true }),
      WebsitePage.find().select('pageName pageUrl lastAuditScore lastScoreCategory pageType internalLinkTarget externalLinkTarget').lean(),
      SeoLink.find({ validationStatus: 'broken' })
        .populate('sourcePageId', 'pageName pageUrl')
        .limit(10)
        .lean(),
      SeoLink.find()
        .populate('sourcePageId', 'pageName pageUrl')
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
    ]);

    // Average SEO link score
    const scoredPages = pages.filter((p) => typeof p.lastAuditScore === 'number' && p.lastAuditScore > 0);
    const avgScore = scoredPages.length
      ? Math.round(scoredPages.reduce((acc, p) => acc + p.lastAuditScore, 0) / scoredPages.length)
      : 78;

    // Score distribution
    const scoreDistribution = {
      excellent: pages.filter((p) => p.lastAuditScore >= 90).length,
      good: pages.filter((p) => p.lastAuditScore >= 75 && p.lastAuditScore < 90).length,
      needsImprovement: pages.filter((p) => p.lastAuditScore >= 50 && p.lastAuditScore < 75).length,
      poor: pages.filter((p) => p.lastAuditScore < 50).length,
    };

    // Health distribution
    const workingLinks = await SeoLink.countDocuments({ validationStatus: 'working' });
    const pendingLinks = await SeoLink.countDocuments({ validationStatus: 'pending' });
    const redirectedLinks = await SeoLink.countDocuments({ validationStatus: 'redirected' });

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalPages,
          totalInternalLinks,
          totalExternalLinks,
          totalLinks: totalInternalLinks + totalExternalLinks,
          brokenLinks: brokenLinksCount,
          duplicateLinks: duplicateLinksCount,
          averageScore: avgScore,
        },
        distribution: {
          internal: totalInternalLinks,
          external: totalExternalLinks,
        },
        scoreDistribution,
        healthStatusCounts: {
          working: workingLinks,
          broken: brokenLinksCount,
          pending: pendingLinks,
          redirected: redirectedLinks,
        },
        brokenLinks,
        recentLinks,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get links list with filtering, search, and server-side pagination
 * @route GET /api/seo-links
 */
export const getLinks = async (req, res) => {
  try {
    const {
      pageId = 'all',
      linkType = 'all',
      status = 'all',
      validationStatus = 'all',
      placement = 'all',
      isDuplicate,
      search = '',
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    if (pageId !== 'all') {
      query.sourcePageId = pageId;
    }

    if (linkType !== 'all') {
      query.linkType = linkType;
    }

    if (status !== 'all') {
      query.status = status;
    }

    if (validationStatus !== 'all') {
      query.validationStatus = validationStatus;
    }

    if (placement !== 'all') {
      query.placement = placement;
    }

    if (isDuplicate !== undefined) {
      query.isDuplicate = isDuplicate === 'true';
    }

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { anchorText: searchRegex },
        { destinationUrl: searchRegex },
        { description: searchRegex },
        { websiteName: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [total, links] = await Promise.all([
      SeoLink.countDocuments(query),
      SeoLink.find(query)
        .populate('sourcePageId', 'pageName pageUrl publishedStatus')
        .populate('destinationPageId', 'pageName pageUrl publishedStatus')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      success: true,
      data: links,
      links,
      total,
      totalRecords: total,
      page: pageNum,
      currentPage: pageNum,
      totalPages,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Create a new Internal or External Link
 * @route POST /api/seo-links
 */
export const createLink = async (req, res) => {
  try {
    const {
      sourcePageId,
      linkType,
      destinationPageId,
      destinationUrl,
      anchorText,
      description = '',
      websiteName = '',
      placement = 'content_body',
      relAttribute = 'follow',
      targetAttribute = '_self',
      status = 'active',
    } = req.body;

    if (!sourcePageId) {
      return res.status(400).json({ success: false, message: 'Source Page is required' });
    }
    if (!destinationUrl || !destinationUrl.trim()) {
      return res.status(400).json({ success: false, message: 'Destination URL is required' });
    }
    if (!anchorText || !anchorText.trim()) {
      return res.status(400).json({ success: false, message: 'Anchor Text is required' });
    }

    const sourcePage = await WebsitePage.findById(sourcePageId);
    if (!sourcePage) {
      return res.status(404).json({ success: false, message: 'Source page not found' });
    }

    // Determine destinationPageId if internal and omitted
    let finalDestPageId = destinationPageId || null;
    let finalLinkType = linkType || (destinationUrl.trim().startsWith('/') ? 'internal' : 'external');

    if (finalLinkType === 'internal' && !finalDestPageId) {
      const destPage = await WebsitePage.findOne({ pageUrl: destinationUrl.trim() });
      if (destPage) finalDestPageId = destPage._id;
    }

    // Check duplicate link destination on the same page
    const existingSameUrl = await SeoLink.findOne({
      sourcePageId,
      destinationUrl: destinationUrl.trim(),
    });
    const isDuplicate = !!existingSameUrl;

    // Run safe live validation
    const validation = await validateUrlDestination(destinationUrl.trim(), finalLinkType === 'internal');

    const newLink = await SeoLink.create({
      sourcePageId,
      linkType: finalLinkType,
      destinationPageId: finalDestPageId,
      destinationUrl: destinationUrl.trim(),
      anchorText: anchorText.trim(),
      description: description.trim(),
      websiteName: websiteName.trim(),
      placement,
      relAttribute,
      targetAttribute: finalLinkType === 'external' ? targetAttribute || '_blank' : targetAttribute || '_self',
      status,
      validationStatus: validation.status,
      httpStatusCode: validation.statusCode,
      validationError: validation.error,
      lastCheckedAt: new Date(),
      isDuplicate,
    });

    // Auto-update page audit score
    const allLinks = await SeoLink.find({ sourcePageId });
    const auditResult = calculatePageSeoScore(sourcePage, allLinks);

    await WebsitePage.findByIdAndUpdate(sourcePageId, {
      lastAuditScore: auditResult.score,
      lastScoreCategory: auditResult.scoreCategory,
      lastAuditedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: `${finalLinkType === 'internal' ? 'Internal' : 'External'} link added successfully`,
      data: newLink,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Update an existing link
 * @route PUT /api/seo-links/:id
 */
export const updateLink = async (req, res) => {
  try {
    const link = await SeoLink.findById(req.params.id);
    if (!link) {
      return res.status(404).json({ success: false, message: 'Link not found' });
    }

    const {
      sourcePageId,
      linkType,
      destinationPageId,
      destinationUrl,
      anchorText,
      description,
      websiteName,
      placement,
      relAttribute,
      targetAttribute,
      status,
    } = req.body;

    if (sourcePageId) link.sourcePageId = sourcePageId;
    if (linkType) link.linkType = linkType;
    if (destinationPageId !== undefined) link.destinationPageId = destinationPageId || null;
    if (anchorText) link.anchorText = anchorText.trim();
    if (description !== undefined) link.description = description.trim();
    if (websiteName !== undefined) link.websiteName = websiteName.trim();
    if (placement) link.placement = placement;
    if (relAttribute) link.relAttribute = relAttribute;
    if (targetAttribute) link.targetAttribute = targetAttribute;
    if (status) link.status = status;

    let urlChanged = false;
    if (destinationUrl && destinationUrl.trim() !== link.destinationUrl) {
      link.destinationUrl = destinationUrl.trim();
      urlChanged = true;
    }

    // Check duplicate
    const duplicate = await SeoLink.findOne({
      _id: { $ne: link._id },
      sourcePageId: link.sourcePageId,
      destinationUrl: link.destinationUrl,
    });
    link.isDuplicate = !!duplicate;

    // If URL changed or status pending, revalidate
    if (urlChanged) {
      const validation = await validateUrlDestination(link.destinationUrl, link.linkType === 'internal');
      link.validationStatus = validation.status;
      link.httpStatusCode = validation.statusCode;
      link.validationError = validation.error;
      link.lastCheckedAt = new Date();
    }

    await link.save();

    // Re-audit source page
    const sourcePage = await WebsitePage.findById(link.sourcePageId);
    if (sourcePage) {
      const allLinks = await SeoLink.find({ sourcePageId: sourcePage._id });
      const auditResult = calculatePageSeoScore(sourcePage, allLinks);
      await WebsitePage.findByIdAndUpdate(sourcePage._id, {
        lastAuditScore: auditResult.score,
        lastScoreCategory: auditResult.scoreCategory,
        lastAuditedAt: new Date(),
      });
    }

    res.status(200).json({
      success: true,
      message: 'SEO link updated successfully',
      data: link,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Delete a link
 * @route DELETE /api/seo-links/:id
 */
export const deleteLink = async (req, res) => {
  try {
    const link = await SeoLink.findById(req.params.id);
    if (!link) {
      return res.status(404).json({ success: false, message: 'Link not found' });
    }

    const sourcePageId = link.sourcePageId;
    await SeoLink.findByIdAndDelete(req.params.id);

    // Re-audit source page
    const sourcePage = await WebsitePage.findById(sourcePageId);
    if (sourcePage) {
      const allLinks = await SeoLink.find({ sourcePageId });
      const auditResult = calculatePageSeoScore(sourcePage, allLinks);
      await WebsitePage.findByIdAndUpdate(sourcePageId, {
        lastAuditScore: auditResult.score,
        lastScoreCategory: auditResult.scoreCategory,
        lastAuditedAt: new Date(),
      });
    }

    res.status(200).json({
      success: true,
      message: 'SEO link removed successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Validate a single link by ID
 * @route POST /api/seo-links/validate/:id
 */
export const validateSingleLink = async (req, res) => {
  try {
    const link = await SeoLink.findById(req.params.id);
    if (!link) {
      return res.status(404).json({ success: false, message: 'Link not found' });
    }

    const validation = await validateUrlDestination(link.destinationUrl, link.linkType === 'internal');
    link.validationStatus = validation.status;
    link.httpStatusCode = validation.statusCode;
    link.validationError = validation.error;
    link.lastCheckedAt = new Date();
    await link.save();

    // Re-audit source page
    const sourcePage = await WebsitePage.findById(link.sourcePageId);
    if (sourcePage) {
      const allLinks = await SeoLink.find({ sourcePageId: sourcePage._id });
      const auditResult = calculatePageSeoScore(sourcePage, allLinks);
      await WebsitePage.findByIdAndUpdate(sourcePage._id, {
        lastAuditScore: auditResult.score,
        lastScoreCategory: auditResult.scoreCategory,
        lastAuditedAt: new Date(),
      });
    }

    res.status(200).json({
      success: true,
      message: `Link validation finished: ${link.validationStatus}`,
      data: link,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Batch validate all links (or for a specific page)
 * @route POST /api/seo-links/validate-all
 */
export const validateAllLinks = async (req, res) => {
  try {
    const { pageId } = req.body;
    const filter = pageId ? { sourcePageId: pageId } : {};

    const links = await SeoLink.find(filter);
    let working = 0;
    let broken = 0;
    let temporaryError = 0;
    let redirected = 0;

    for (const link of links) {
      const val = await validateUrlDestination(link.destinationUrl, link.linkType === 'internal');
      link.validationStatus = val.status;
      link.httpStatusCode = val.statusCode;
      link.validationError = val.error;
      link.lastCheckedAt = new Date();
      await link.save();

      if (val.status === 'working') working++;
      else if (val.status === 'broken') broken++;
      else if (val.status === 'redirected') redirected++;
      else temporaryError++;
    }

    // Re-audit all affected pages
    const affectedPageIds = [...new Set(links.map((l) => l.sourcePageId.toString()))];
    for (const pid of affectedPageIds) {
      const page = await WebsitePage.findById(pid);
      if (page) {
        const pageLinks = await SeoLink.find({ sourcePageId: pid });
        const audit = calculatePageSeoScore(page, pageLinks);
        await WebsitePage.findByIdAndUpdate(pid, {
          lastAuditScore: audit.score,
          lastScoreCategory: audit.scoreCategory,
          lastAuditedAt: new Date(),
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Validated ${links.length} link(s): ${working} working, ${broken} broken, ${redirected} redirected, ${temporaryError} temporary errors`,
      summary: { total: links.length, working, broken, redirected, temporaryError },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Run 100-point SEO Audit on a specific page
 * @route POST /api/seo-links/analyze/:pageId
 */
export const analyzePage = async (req, res) => {
  try {
    const page = await WebsitePage.findById(req.params.pageId);
    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }

    const links = await SeoLink.find({ sourcePageId: page._id });
    const auditResult = calculatePageSeoScore(page, links);

    // Save audit snapshot
    const auditDoc = await SeoLinkAudit.create({
      pageId: page._id,
      totalInternalLinks: auditResult.stats.totalInternalLinks,
      totalExternalLinks: auditResult.stats.totalExternalLinks,
      activeInternalLinks: auditResult.stats.activeInternalLinks,
      activeExternalLinks: auditResult.stats.activeExternalLinks,
      brokenLinks: auditResult.stats.brokenLinks,
      duplicateLinks: auditResult.stats.duplicateLinks,
      score: auditResult.score,
      scoreCategory: auditResult.scoreCategory,
      factors: auditResult.factors,
      recommendations: auditResult.recommendations,
      analyzedAt: new Date(),
    });

    // Update page
    page.lastAuditScore = auditResult.score;
    page.lastScoreCategory = auditResult.scoreCategory;
    page.lastAuditedAt = new Date();
    await page.save();

    res.status(200).json({
      success: true,
      message: `Audit completed: Score is ${auditResult.score}/100 (${auditResult.scoreCategory})`,
      data: auditDoc,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get all broken links across the website
 * @route GET /api/seo-links/broken
 */
export const getBrokenLinks = async (req, res) => {
  try {
    const broken = await SeoLink.find({ validationStatus: 'broken' })
      .populate('sourcePageId', 'pageName pageUrl')
      .populate('destinationPageId', 'pageName pageUrl')
      .sort({ updatedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: broken.length,
      data: broken,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Export SEO Links as CSV or JSON
 * @route GET /api/seo-links/export?format=csv|json
 */
export const exportLinks = async (req, res) => {
  try {
    const { format = 'csv' } = req.query;

    const links = await SeoLink.find()
      .populate('sourcePageId', 'pageName pageUrl')
      .sort({ createdAt: -1 })
      .lean();

    if (format === 'json') {
      res.header('Content-Type', 'application/json');
      res.attachment('vr4web-seo-links-export.json');
      return res.status(200).send(JSON.stringify(links, null, 2));
    }

    // CSV format
    const headers = [
      'Source Page Name',
      'Source Page URL',
      'Link Type',
      'Destination URL',
      'Anchor Text',
      'Placement',
      'Rel Attribute',
      'Target',
      'Status',
      'Validation Status',
      'HTTP Status Code',
      'Is Duplicate',
      'Last Checked At',
    ];

    const rows = links.map((l) => [
      `"${(l.sourcePageId?.pageName || '').replace(/"/g, '""')}"`,
      `"${(l.sourcePageId?.pageUrl || '').replace(/"/g, '""')}"`,
      l.linkType,
      `"${(l.destinationUrl || '').replace(/"/g, '""')}"`,
      `"${(l.anchorText || '').replace(/"/g, '""')}"`,
      l.placement,
      l.relAttribute,
      l.targetAttribute,
      l.status,
      l.validationStatus,
      l.httpStatusCode || '',
      l.isDuplicate ? 'Yes' : 'No',
      l.lastCheckedAt ? new Date(l.lastCheckedAt).toISOString() : '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.header('Content-Type', 'text/csv');
    res.attachment('vr4web-seo-links-export.csv');
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Public endpoint for frontend dynamic link rendering
 * @route GET /api/seo-links/public/:pageSlug
 */
export const getPublicPageLinks = async (req, res) => {
  try {
    const { pageSlug } = req.params;

    // Find page by slug or normalized URL
    const normalized = pageSlug === 'home' || pageSlug === 'index' ? 'home' : pageSlug.toLowerCase().trim();

    const page = await WebsitePage.findOne({
      $or: [
        { pageSlug: normalized },
        { pageUrl: `/${normalized}` },
        { pageUrl: normalized.startsWith('/') ? normalized : `/${normalized}` },
      ],
      publishedStatus: 'published',
    }).lean();

    if (!page) {
      return res.status(200).json({
        success: true,
        data: {
          page: null,
          links: [],
          byPlacement: {},
        },
      });
    }

    // Only active links
    const links = await SeoLink.find({
      sourcePageId: page._id,
      status: 'active',
      validationStatus: { $ne: 'broken' }, // filter out confirmed broken links from public frontend
    })
      .select('linkType destinationUrl anchorText description websiteName placement relAttribute targetAttribute order')
      .sort({ order: 1, createdAt: 1 })
      .lean();

    // Group by placement for easy in-component consumption
    const byPlacement = {
      header: [],
      content_top: [],
      content_body: [],
      content_bottom: [],
      sidebar: [],
      footer: [],
      related_links: [],
    };

    links.forEach((link) => {
      const p = link.placement || 'content_body';
      if (!byPlacement[p]) byPlacement[p] = [];
      byPlacement[p].push(link);
    });

    res.status(200).json({
      success: true,
      data: {
        page: {
          id: page._id,
          name: page.pageName,
          slug: page.pageSlug,
          url: page.pageUrl,
          metaTitle: page.metaTitle,
          metaDescription: page.metaDescription,
        },
        links,
        byPlacement,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

