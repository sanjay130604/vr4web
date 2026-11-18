import express from 'express';
import CaseStudy from '../models/CaseStudy.js';
import Blog from '../models/Blog.js';

const router = express.Router();
const BASE_URL = process.env.PUBLIC_SITE_URL || 'https://vr4web.com';

/**
 * @desc Public social crawler & preview endpoint
 * @route GET /api/public/meta/:type/:slug
 */
router.get('/:type/:slug', async (req, res) => {
  try {
    const { type, slug } = req.params;
    let item = null;
    let pageUrl = '';
    let defaultImg = `${BASE_URL}/vr4web.png`;

    if (type === 'case-study' || type === 'case-studies') {
      item = await CaseStudy.findOne({ slug: slug.toLowerCase(), status: 'published' });
      pageUrl = `${BASE_URL}/case-studies/${slug}`;
      defaultImg = `${BASE_URL}/case-study/property.png`;
    } else if (type === 'blog' || type === 'blogs') {
      item = await Blog.findOne({ slug: slug.toLowerCase(), status: 'published' });
      pageUrl = `${BASE_URL}/blog/${slug}`;
      defaultImg = `${BASE_URL}/blogs/blogs-banner.png`;
    }

    if (!item) {
      return res.status(404).send('<!DOCTYPE html><html><head><title>Not Found</title></head><body><h1>404 Not Found</h1></body></html>');
    }

    const title = item.seo?.metaTitle || item.metaTitle || item.title || 'VR4Web Digital Solutions';
    const desc = item.seo?.metaDescription || item.metaDescription || item.shortDescription || item.summary || 'Enterprise digital engineering & modern web development.';
    const keywords = (Array.isArray(item.seo?.keywords) && item.seo.keywords.length > 0)
      ? item.seo.keywords.join(', ')
      : (Array.isArray(item.metaKeywords) && item.metaKeywords.length > 0)
      ? item.metaKeywords.join(', ')
      : 'VR4Web, Web Development, Digital Solutions';
    const canonical = item.seo?.canonicalUrl || item.canonicalUrl || pageUrl;
    const ogTitle = item.seo?.ogTitle || item.ogTitle || title;
    const ogDesc = item.seo?.ogDescription || item.ogDescription || desc;
    let ogImg = item.seo?.ogImage || item.ogImage || item.featuredImage?.url || item.featuredImage || defaultImg;
    if (ogImg.startsWith('/')) ogImg = `${BASE_URL}${ogImg}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(desc)}">
  <meta name="keywords" content="${escapeHtml(keywords)}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  
  <!-- Open Graph Meta Tags -->
  <meta property="og:site_name" content="VR4Web">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(ogTitle)}">
  <meta property="og:description" content="${escapeHtml(ogDesc)}">
  <meta property="og:image" content="${escapeHtml(ogImg)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  
  <!-- Twitter Cards -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@vr4web">
  <meta name="twitter:title" content="${escapeHtml(ogTitle)}">
  <meta name="twitter:description" content="${escapeHtml(ogDesc)}">
  <meta name="twitter:image" content="${escapeHtml(ogImg)}">
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p>${escapeHtml(desc)}</p>
  <img src="${escapeHtml(ogImg)}" alt="${escapeHtml(title)}" />
</body>
</html>`;

    res.header('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (error) {
    res.status(500).send(`Server error: ${error.message}`);
  }
});

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default router;

