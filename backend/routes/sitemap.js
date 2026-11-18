import express from 'express';
import CaseStudy from '../models/CaseStudy.js';
import Blog from '../models/Blog.js';

const router = express.Router();

const BASE_URL = process.env.PUBLIC_SITE_URL || 'https://vr4web.com';

/**
 * @desc Generate dynamic XML sitemap
 * @route GET /sitemap.xml and GET /api/sitemap.xml
 */
export const getSitemapXml = async (req, res) => {
  try {
    // Only published content is included
    const [caseStudies, blogs] = await Promise.all([
      CaseStudy.find({ status: 'published' }).select('slug canonicalUrl updatedAt publishedAt'),
      Blog.find({ status: 'published' }).select('slug canonicalUrl updatedAt publishedAt'),
    ]);

    const staticRoutes = [
      { path: '/', priority: '1.0', changefreq: 'daily' },
      { path: '/services', priority: '0.9', changefreq: 'weekly' },
      { path: '/case-studies', priority: '0.9', changefreq: 'weekly' },
      { path: '/blogs', priority: '0.9', changefreq: 'daily' },
      { path: '/about', priority: '0.8', changefreq: 'monthly' },
      { path: '/contact', priority: '0.8', changefreq: 'monthly' },
      { path: '/gallery', priority: '0.7', changefreq: 'monthly' },
      { path: '/newspaper', priority: '0.7', changefreq: 'monthly' },
    ];

    const today = new Date().toISOString().split('T')[0];

    const staticEntries = staticRoutes
      .map(
        (r) => `  <url>
    <loc>${BASE_URL}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
      )
      .join('\n');

    const caseStudyEntries = caseStudies
      .map((cs) => {
        const loc =
          (cs.canonicalUrl && cs.canonicalUrl.trim()) ||
          `${BASE_URL}/case-studies/${cs.slug}`;
        const lastmod = (cs.updatedAt || cs.publishedAt || new Date())
          .toISOString()
          .split('T')[0];
        return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      })
      .join('\n');

    const blogEntries = blogs
      .map((b) => {
        const loc =
          (b.canonicalUrl && b.canonicalUrl.trim()) ||
          `${BASE_URL}/blog/${b.slug}`;
        const lastmod = (b.updatedAt || b.publishedAt || new Date())
          .toISOString()
          .split('T')[0];
        return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      })
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${caseStudyEntries}
${blogEntries}
</urlset>`;

    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.status(200).send(xml);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Check slug uniqueness for live validation in admin forms
 * @route GET /api/sitemap/check-slug?type=casestudy|blog&slug=...&excludeId=...
 */
router.get('/check-slug', async (req, res) => {
  try {
    const { type, slug, excludeId } = req.query;
    if (!slug) {
      return res.status(400).json({ success: false, message: 'Slug query is required' });
    }

    const cleanSlug = slug.trim().toLowerCase();
    let isAvailable = true;

    if (type === 'casestudy' || type === 'case-study') {
      const existing = await CaseStudy.findOne({
        slug: cleanSlug,
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
      });
      isAvailable = !existing;
    } else if (type === 'blog') {
      const existing = await Blog.findOne({
        slug: cleanSlug,
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
      });
      isAvailable = !existing;
    }

    res.status(200).json({
      success: true,
      available: isAvailable,
      slug: cleanSlug,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/sitemap.xml', getSitemapXml);
router.get('/', getSitemapXml);

export default router;

