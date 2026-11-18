import net from 'net';
import WebsitePage from '../models/WebsitePage.js';
import SeoLink from '../models/SeoLink.js';
import SeoLinkAudit from '../models/SeoLinkAudit.js';
import Blog from '../models/Blog.js';
import CaseStudy from '../models/CaseStudy.js';

// Base site URL for relative internal link checking
const BASE_SITE_URL = process.env.PUBLIC_SITE_URL || 'https://vr4web.com';

// Target recommendations from specs
export const DEFAULT_PAGE_TARGETS = {
  home: { internal: 10, external: 2 },
  about: { internal: 5, external: 2 },
  services_listing: { internal: 8, external: 4 },
  service_detail: { internal: 5, external: 2 },
  case_studies_listing: { internal: 5, external: 3 },
  case_study_detail: { internal: 4, external: 2 },
  blogs_listing: { internal: 6, external: 2 },
  blog_detail: { internal: 6, external: 3 },
  newspaper: { internal: 4, external: 2 },
  gallery: { internal: 4, external: 1 },
  contact: { internal: 4, external: 1 },
  pricing: { internal: 5, external: 2 },
  custom: { internal: 4, external: 2 },
};

/**
 * SSRF Protection: Checks if hostname/IP points to private/internal/local network
 */
export const isPrivateOrLocalIp = (hostname) => {
  if (!hostname) return true;
  const clean = hostname.trim().toLowerCase();

  // Localhost names
  if (
    clean === 'localhost' ||
    clean === '127.0.0.1' ||
    clean === '0.0.0.0' ||
    clean === '::1' ||
    clean.endsWith('.local') ||
    clean.endsWith('.internal')
  ) {
    return true;
  }

  // Check IPv4
  if (net.isIPv4(clean)) {
    const parts = clean.split('.').map(Number);
    // 127.0.0.0/8 (loopback)
    if (parts[0] === 127) return true;
    // 10.0.0.0/8 (private)
    if (parts[0] === 10) return true;
    // 172.16.0.0/12 (private 172.16.x.x - 172.31.x.x)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16 (private)
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 169.254.0.0/16 (link local, cloud metadata like 169.254.169.254)
    if (parts[0] === 169 && parts[1] === 254) return true;
    // 0.0.0.0/8
    if (parts[0] === 0) return true;
  }

  return false;
};

/**
 * Validate a single URL with SSRF protection, timeout, and status classification
 */
export const validateUrlDestination = async (urlStr, isInternal = false) => {
  if (!urlStr || typeof urlStr !== 'string') {
    return {
      status: 'broken',
      statusCode: 400,
      error: 'URL is missing or empty',
    };
  }

  const trimmed = urlStr.trim();

  // Internal URL validation (starts with / or matches domain)
  if (isInternal || trimmed.startsWith('/') || trimmed.startsWith(BASE_SITE_URL)) {
    const pathPart = trimmed.startsWith('http')
      ? new URL(trimmed).pathname
      : trimmed.split('?')[0].split('#')[0];

    // Check if the page exists in WebsitePage or matches registered patterns
    const pageDoc = await WebsitePage.findOne({
      pageUrl: { $regex: new RegExp(`^${pathPart.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') },
      publishedStatus: 'published',
    });

    if (pageDoc) {
      return {
        status: 'working',
        statusCode: 200,
        destinationPageId: pageDoc._id,
        error: '',
      };
    }

    // Check if it matches known static routes
    const knownStatic = [
      '/',
      '/about',
      '/services',
      '/case-studies',
      '/blogs',
      '/newspaper',
      '/gallery',
      '/contact',
      '/pricing',
      '/testimonials',
      '/brands-partners',
      '/how-we-work',
      '/client',
      '/privacy-policy',
    ];

    if (knownStatic.includes(pathPart.toLowerCase())) {
      return {
        status: 'working',
        statusCode: 200,
        error: '',
      };
    }

    // Check dynamic blog / case study in database directly
    const blogSlugMatch = pathPart.match(/^\/blog(?:s)?\/([a-zA-Z0-9_-]+)$/i);
    if (blogSlugMatch) {
      const blog = await Blog.findOne({ slug: blogSlugMatch[1], status: 'published' });
      if (blog) return { status: 'working', statusCode: 200, error: '' };
    }

    const csSlugMatch = pathPart.match(/^\/case-stud(?:y|ies)\/([a-zA-Z0-9_-]+)$/i);
    if (csSlugMatch) {
      const cs = await CaseStudy.findOne({ slug: csSlugMatch[1], status: 'published' });
      if (cs) return { status: 'working', statusCode: 200, error: '' };
    }

    return {
      status: 'broken',
      statusCode: 404,
      error: 'Internal destination page does not exist or is unpublished',
    };
  }

  // External URL validation
  let parsedUrl;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    return {
      status: 'broken',
      statusCode: 400,
      error: 'Invalid URL format',
    };
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return {
      status: 'broken',
      statusCode: 400,
      error: `Unsupported protocol ${parsedUrl.protocol}. Only http and https are permitted.`,
    };
  }

  // SSRF check
  if (isPrivateOrLocalIp(parsedUrl.hostname)) {
    return {
      status: 'broken',
      statusCode: 403,
      error: 'Security Warning: Private, localhost, or internal cloud IP addresses cannot be targeted (SSRF Protection).',
    };
  }

  // Make an actual HTTP HEAD or GET request with 5s timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    let response;
    try {
      // First attempt fast HEAD request
      response = await fetch(trimmed, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) VR4Web-Link-Auditor/2.0 (compatible; SEO Bot)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
    } catch {
      // If HEAD is rejected or method not allowed, fallback to GET
      response = await fetch(trimmed, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) VR4Web-Link-Auditor/2.0 (compatible; SEO Bot)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
    }

    clearTimeout(timeoutId);

    const statusCode = response.status;
    if (statusCode >= 200 && statusCode < 300) {
      return {
        status: 'working',
        statusCode,
        error: '',
      };
    } else if (statusCode >= 300 && statusCode < 400) {
      return {
        status: 'redirected',
        statusCode,
        error: `Redirects with HTTP status ${statusCode}`,
      };
    } else if (statusCode === 404 || statusCode === 410) {
      return {
        status: 'broken',
        statusCode,
        error: `Page not found (HTTP ${statusCode})`,
      };
    } else {
      // 403, 429, 500, 502, 503, etc. -> classify as temporary error or restricted
      return {
        status: 'temporary_error',
        statusCode,
        error: `Remote server returned status ${statusCode}`,
      };
    }
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return {
        status: 'temporary_error',
        statusCode: 408,
        error: 'Connection timed out after 6 seconds (temporary error)',
      };
    }
    if (err.code === 'ENOTFOUND') {
      return {
        status: 'broken',
        statusCode: 404,
        error: 'Domain name could not be resolved (DNS ENOTFOUND)',
      };
    }
    return {
      status: 'temporary_error',
      statusCode: null,
      error: err.message || 'Network connection failed',
    };
  }
};

/**
 * 100-Point SEO Link Score Engine
 * Computes transparent breakdown based on the prompt's 8 distinct factors
 */
export const calculatePageSeoScore = (page, links) => {
  const internalLinks = links.filter((l) => l.linkType === 'internal');
  const externalLinks = links.filter((l) => l.linkType === 'external');

  const activeInternal = internalLinks.filter((l) => l.status === 'active');
  const activeExternal = externalLinks.filter((l) => l.status === 'active');

  const brokenInternal = internalLinks.filter((l) => l.validationStatus === 'broken');
  const brokenExternal = externalLinks.filter((l) => l.validationStatus === 'broken');
  const totalBroken = brokenInternal.length + brokenExternal.length;

  const duplicates = links.filter((l) => l.isDuplicate);
  const totalDuplicates = duplicates.length;

  const internalTarget = Math.max(1, page.internalLinkTarget || 5);
  const externalTarget = Math.max(1, page.externalLinkTarget || 2);

  const recommendations = [];

  // 1. Internal Link Coverage (25 Points)
  let internalScore = 0;
  const internalRatio = activeInternal.length / internalTarget;
  if (internalRatio >= 1.0) {
    internalScore = 25;
  } else if (internalRatio >= 0.7) {
    internalScore = 20;
    recommendations.push(
      `Add ${internalTarget - activeInternal.length} more relevant internal link(s) to reach the recommended target of ${internalTarget}.`
    );
  } else if (internalRatio >= 0.4) {
    internalScore = 14;
    recommendations.push(
      `Internal link coverage is low (${activeInternal.length}/${internalTarget}). Add contextual internal links.`
    );
  } else if (activeInternal.length > 0) {
    internalScore = 8;
    recommendations.push(`Page has only ${activeInternal.length} internal link(s). Target is ${internalTarget}.`);
  } else {
    internalScore = 0;
    recommendations.push(`No active internal links found. Link this page to related services or case studies.`);
  }

  // 2. External Link Quality & Relevance (15 Points)
  let externalScore = 0;
  const externalRatio = activeExternal.length / externalTarget;
  const workingExternal = activeExternal.filter((l) => l.validationStatus === 'working');
  if (externalRatio >= 1.0 && workingExternal.length >= externalTarget) {
    externalScore = 15;
  } else if (workingExternal.length > 0) {
    externalScore = 10;
    if (activeExternal.length < externalTarget) {
      recommendations.push(
        `Consider adding ${externalTarget - activeExternal.length} authoritative reference link(s) to reputable industry sources.`
      );
    }
  } else if (activeExternal.length > 0) {
    externalScore = 5;
    recommendations.push('External links require validation verification.');
  } else {
    externalScore = 4; // Not penalized harshly if page naturally has few external references
  }

  // 3. Meta Title (15 Points)
  let metaTitleScore = 0;
  const titleLen = (page.metaTitle || page.pageName || '').trim().length;
  if (titleLen >= 30 && titleLen <= 65) {
    metaTitleScore = 15;
  } else if (titleLen > 0 && titleLen < 30) {
    metaTitleScore = 9;
    recommendations.push('Meta title is short. Aim for 30–65 characters including primary target keywords.');
  } else if (titleLen > 65) {
    metaTitleScore = 10;
    recommendations.push('Meta title exceeds 65 characters and may be truncated in search results.');
  } else {
    metaTitleScore = 0;
    recommendations.push('Meta title is missing. Specify an engaging SEO title.');
  }

  // 4. Meta Description (10 Points)
  let metaDescScore = 0;
  const descLen = (page.metaDescription || '').trim().length;
  if (descLen >= 110 && descLen <= 165) {
    metaDescScore = 10;
  } else if (descLen > 0 && descLen < 110) {
    metaDescScore = 6;
    recommendations.push('Meta description is brief. Expand to 110–160 characters with clear call-to-action.');
  } else if (descLen > 165) {
    metaDescScore = 6;
    recommendations.push('Meta description exceeds 165 characters. Shorten to prevent SERP truncation.');
  } else {
    metaDescScore = 0;
    recommendations.push('Meta description is missing. Add a descriptive summary for search snippets.');
  }

  // 5. Heading Structure (10 Points)
  let headingScore = 0;
  const h1Count = page.h1Count ?? 1;
  if (h1Count === 1) {
    headingScore = 10;
  } else if (h1Count > 1) {
    headingScore = 6;
    recommendations.push('Multiple H1 headings detected. Best practice is exactly one primary H1 per page.');
  } else {
    headingScore = 3;
    recommendations.push('No H1 heading detected. Ensure the page contains a prominent primary heading.');
  }

  // 6. Image Alt Text (10 Points)
  let imageAltScore = 0;
  const totalImgs = page.imagesCount ?? 0;
  const imgsWithAlt = page.imagesWithAlt ?? 0;
  if (totalImgs === 0) {
    imageAltScore = 10; // No image violations
  } else {
    const altRatio = imgsWithAlt / totalImgs;
    if (altRatio >= 0.95) {
      imageAltScore = 10;
    } else if (altRatio >= 0.7) {
      imageAltScore = 7;
      recommendations.push(`${totalImgs - imgsWithAlt} image(s) are missing descriptive alt text.`);
    } else {
      imageAltScore = 3;
      recommendations.push('Majority of images lack alt attributes. Add descriptive alt text for accessibility & SEO.');
    }
  }

  // 7. URL Structure (5 Points)
  let urlScore = 5;
  const cleanUrl = (page.pageUrl || '').trim();
  if (cleanUrl.length > 80) {
    urlScore -= 2;
    recommendations.push('Page URL is long (> 80 characters). Prefer short, descriptive slugs.');
  }
  if (/[A-Z]/.test(cleanUrl)) {
    urlScore -= 1;
    recommendations.push('URL contains uppercase letters. URLs should always be lowercase.');
  }
  if (/[_ ]/.test(cleanUrl)) {
    urlScore -= 2;
    recommendations.push('URL contains underscores or spaces. Use hyphens (-) as word separators.');
  }
  urlScore = Math.max(0, urlScore);

  // 8. Content Quality Indicators (10 Points)
  let contentScore = 0;
  const words = page.wordCount ?? 450;
  if (words >= 500) {
    contentScore = 10;
  } else if (words >= 300) {
    contentScore = 7;
  } else if (words >= 150) {
    contentScore = 4;
    recommendations.push('Page content depth is light (< 300 words). Expand content with useful insights.');
  } else {
    contentScore = 2;
    recommendations.push('Thin content detected. Provide thorough information to satisfy visitor intent.');
  }

  // Calculate Base Total
  let totalScore =
    internalScore +
    externalScore +
    metaTitleScore +
    metaDescScore +
    headingScore +
    imageAltScore +
    urlScore +
    contentScore;

  // Penalty Deductions for Broken & Duplicate Links
  if (totalBroken > 0) {
    const penalty = totalBroken * 5;
    totalScore = Math.max(0, totalScore - penalty);
    recommendations.unshift(`CRITICAL: ${totalBroken} broken link(s) detected. Fix or replace invalid destination URLs.`);
  }

  if (totalDuplicates > 0) {
    const penalty = totalDuplicates * 3;
    totalScore = Math.max(0, totalScore - penalty);
    recommendations.push(`${totalDuplicates} duplicate link destination(s) found on this page. Consolidate repetitive links.`);
  }

  totalScore = Math.min(100, Math.max(0, Math.round(totalScore)));

  let scoreCategory = 'Needs Improvement';
  if (totalScore >= 90) scoreCategory = 'Excellent';
  else if (totalScore >= 75) scoreCategory = 'Good';
  else if (totalScore >= 50) scoreCategory = 'Needs Improvement';
  else scoreCategory = 'Poor';

  return {
    score: totalScore,
    scoreCategory,
    factors: {
      internalLinkCoverage: {
        score: internalScore,
        maxScore: 25,
        status: internalScore >= 20 ? 'pass' : internalScore >= 12 ? 'warning' : 'fail',
        feedback: `${activeInternal.length} of ${internalTarget} target internal links active.`,
      },
      externalLinkQuality: {
        score: externalScore,
        maxScore: 15,
        status: externalScore >= 12 ? 'pass' : externalScore >= 6 ? 'warning' : 'fail',
        feedback: `${workingExternal.length} verified working external reference(s).`,
      },
      metaTitle: {
        score: metaTitleScore,
        maxScore: 15,
        status: metaTitleScore === 15 ? 'pass' : metaTitleScore >= 9 ? 'warning' : 'fail',
        feedback: titleLen ? `Length: ${titleLen} characters.` : 'Missing meta title.',
      },
      metaDescription: {
        score: metaDescScore,
        maxScore: 10,
        status: metaDescScore === 10 ? 'pass' : metaDescScore >= 6 ? 'warning' : 'fail',
        feedback: descLen ? `Length: ${descLen} characters.` : 'Missing meta description.',
      },
      headingStructure: {
        score: headingScore,
        maxScore: 10,
        status: headingScore === 10 ? 'pass' : 'warning',
        feedback: `H1 tag count: ${h1Count}.`,
      },
      imageAltText: {
        score: imageAltScore,
        maxScore: 10,
        status: imageAltScore >= 8 ? 'pass' : imageAltScore >= 5 ? 'warning' : 'fail',
        feedback: totalImgs ? `${imgsWithAlt}/${totalImgs} images have alt text.` : 'No images on page.',
      },
      urlStructure: {
        score: urlScore,
        maxScore: 5,
        status: urlScore === 5 ? 'pass' : 'warning',
        feedback: `URL: ${cleanUrl}`,
      },
      contentQuality: {
        score: contentScore,
        maxScore: 10,
        status: contentScore >= 7 ? 'pass' : 'warning',
        feedback: `Word count: ~${words} words.`,
      },
    },
    recommendations,
    stats: {
      totalInternalLinks: internalLinks.length,
      totalExternalLinks: externalLinks.length,
      activeInternalLinks: activeInternal.length,
      activeExternalLinks: activeExternal.length,
      brokenLinks: totalBroken,
      duplicateLinks: totalDuplicates,
    },
  };
};

/**
 * Sync all known website pages into WebsitePage collection
 */
export const syncWebsitePages = async () => {
  const staticPages = [
    {
      pageName: 'Home Page',
      pageSlug: 'home',
      pageUrl: '/',
      pageType: 'home',
      internalLinkTarget: 10,
      externalLinkTarget: 2,
      metaTitle: 'VR4Web | Innovative Web, Mobile & Digital Reality Solutions',
      metaDescription: 'VR4Web delivers cutting-edge web design, full-stack development, mobile apps, and 3D virtual reality digital solutions.',
      wordCount: 850,
      imagesCount: 8,
      imagesWithAlt: 8,
      isSystemPage: true,
    },
    {
      pageName: 'About Us',
      pageSlug: 'about',
      pageUrl: '/about',
      pageType: 'about',
      internalLinkTarget: 5,
      externalLinkTarget: 2,
      metaTitle: 'About Us | VR4Web Digital Technology Team',
      metaDescription: 'Learn about VR4Web, our mission, seasoned engineering team, and our passion for creating high-performance digital platforms.',
      wordCount: 650,
      imagesCount: 4,
      imagesWithAlt: 4,
      isSystemPage: true,
    },
    {
      pageName: 'Services Listing',
      pageSlug: 'services',
      pageUrl: '/services',
      pageType: 'services_listing',
      internalLinkTarget: 8,
      externalLinkTarget: 4,
      metaTitle: 'Comprehensive Digital & Web Engineering Services | VR4Web',
      metaDescription: 'Explore our full spectrum of enterprise web development, mobile solutions, cloud infrastructure, and UI/UX design.',
      wordCount: 900,
      imagesCount: 6,
      imagesWithAlt: 6,
      isSystemPage: true,
    },
    {
      pageName: 'Case Studies Listing',
      pageSlug: 'case-studies',
      pageUrl: '/case-studies',
      pageType: 'case_studies_listing',
      internalLinkTarget: 5,
      externalLinkTarget: 3,
      metaTitle: 'Client Success Stories & Portfolio Case Studies | VR4Web',
      metaDescription: 'Browse in-depth case studies showcasing how we solved complex business challenges with modern software engineering.',
      wordCount: 600,
      imagesCount: 6,
      imagesWithAlt: 6,
      isSystemPage: true,
    },
    {
      pageName: 'Blog & Articles',
      pageSlug: 'blogs',
      pageUrl: '/blogs',
      pageType: 'blogs_listing',
      internalLinkTarget: 6,
      externalLinkTarget: 2,
      metaTitle: 'Tech Insights, Engineering Blogs & Guides | VR4Web',
      metaDescription: 'Stay informed with the latest insights in web architecture, AI innovations, mobile app development, and cloud computing.',
      wordCount: 550,
      imagesCount: 4,
      imagesWithAlt: 4,
      isSystemPage: true,
    },
    {
      pageName: 'Newspaper & Publications',
      pageSlug: 'newspaper',
      pageUrl: '/newspaper',
      pageType: 'newspaper',
      internalLinkTarget: 4,
      externalLinkTarget: 2,
      metaTitle: 'Press Releases, News & Whitepaper Publications | VR4Web',
      metaDescription: 'Read our latest editorial publications, industry research papers, and media coverage across the technology ecosystem.',
      wordCount: 400,
      imagesCount: 3,
      imagesWithAlt: 3,
      isSystemPage: true,
    },
    {
      pageName: 'Visual Gallery',
      pageSlug: 'gallery',
      pageUrl: '/gallery',
      pageType: 'gallery',
      internalLinkTarget: 4,
      externalLinkTarget: 1,
      metaTitle: 'Interactive Project & Design Gallery | VR4Web',
      metaDescription: 'Experience our curated showcase of digital designs, project interfaces, 3D renderings, and mobile application mockups.',
      wordCount: 350,
      imagesCount: 12,
      imagesWithAlt: 12,
      isSystemPage: true,
    },
    {
      pageName: 'Pricing Packages',
      pageSlug: 'pricing',
      pageUrl: '/pricing',
      pageType: 'pricing',
      internalLinkTarget: 5,
      externalLinkTarget: 2,
      metaTitle: 'Transparent Pricing & Development Packages | VR4Web',
      metaDescription: 'Explore clear, flexible pricing packages tailored for startups, growing businesses, and enterprise digital solutions.',
      wordCount: 600,
      imagesCount: 2,
      imagesWithAlt: 2,
      isSystemPage: true,
    },
    {
      pageName: 'Contact & Consultation',
      pageSlug: 'contact',
      pageUrl: '/contact',
      pageType: 'contact',
      internalLinkTarget: 4,
      externalLinkTarget: 1,
      metaTitle: 'Get in Touch with Our Digital Specialists | VR4Web',
      metaDescription: 'Contact VR4Web for a free consultation on your web development, mobile application, or custom software requirements.',
      wordCount: 350,
      imagesCount: 1,
      imagesWithAlt: 1,
      isSystemPage: true,
    },
  ];

  // 1. Upsert static pages
  for (const page of staticPages) {
    await WebsitePage.findOneAndUpdate(
      { pageSlug: page.pageSlug },
      { $setOnInsert: page },
      { upsert: true, returnDocument: 'after' }
    );
  }

  // 2. Discover dynamic published Blogs
  try {
    const blogs = await Blog.find({ status: 'published' }).lean();
    for (const b of blogs) {
      const slug = b.slug || b._id.toString();
      await WebsitePage.findOneAndUpdate(
        { pageSlug: `blog-${slug}` },
        {
          $setOnInsert: {
            pageName: `Blog: ${b.title || slug}`,
            pageSlug: `blog-${slug}`,
            pageUrl: `/blog/${slug}`,
            pageType: 'blog_detail',
            internalLinkTarget: 6,
            externalLinkTarget: 3,
            metaTitle: b.seo?.metaTitle || b.title,
            metaDescription: b.seo?.metaDescription || b.summary,
            wordCount: 650,
            imagesCount: 2,
            imagesWithAlt: 2,
            isSystemPage: false,
          },
        },
        { upsert: true, returnDocument: 'after' }
      );
    }
  } catch (err) {
    console.error('[Sync] Error syncing blogs to WebsitePage:', err.message);
  }

  // 3. Discover dynamic published Case Studies
  try {
    const caseStudies = await CaseStudy.find({ status: 'published' }).lean();
    for (const cs of caseStudies) {
      const slug = cs.slug || cs._id.toString();
      await WebsitePage.findOneAndUpdate(
        { pageSlug: `case-study-${slug}` },
        {
          $setOnInsert: {
            pageName: `Case Study: ${cs.title || slug}`,
            pageSlug: `case-study-${slug}`,
            pageUrl: `/case-studies/${slug}`,
            pageType: 'case_study_detail',
            internalLinkTarget: 4,
            externalLinkTarget: 2,
            metaTitle: cs.seo?.metaTitle || cs.title,
            metaDescription: cs.seo?.metaDescription || cs.shortDescription,
            wordCount: 750,
            imagesCount: 4,
            imagesWithAlt: 4,
            isSystemPage: false,
          },
        },
        { upsert: true, returnDocument: 'after' }
      );
    }
  } catch (err) {
    console.error('[Sync] Error syncing case studies to WebsitePage:', err.message);
  }

  // 4. Seed a few foundational links if database has 0 links
  const existingLinksCount = await SeoLink.countDocuments();
  if (existingLinksCount === 0) {
    const homePage = await WebsitePage.findOne({ pageSlug: 'home' });
    const aboutPage = await WebsitePage.findOne({ pageSlug: 'about' });
    const servicesPage = await WebsitePage.findOne({ pageSlug: 'services' });
    const caseStudiesPage = await WebsitePage.findOne({ pageSlug: 'case-studies' });
    const blogsPage = await WebsitePage.findOne({ pageSlug: 'blogs' });
    const contactPage = await WebsitePage.findOne({ pageSlug: 'contact' });
    const pricingPage = await WebsitePage.findOne({ pageSlug: 'pricing' });

    if (homePage) {
      const initialLinks = [
        {
          sourcePageId: homePage._id,
          linkType: 'internal',
          destinationPageId: servicesPage?._id,
          destinationUrl: '/services',
          anchorText: 'Custom Web & Software Development Services',
          placement: 'content_body',
          relAttribute: 'follow',
          targetAttribute: '_self',
          status: 'active',
          validationStatus: 'working',
          httpStatusCode: 200,
        },
        {
          sourcePageId: homePage._id,
          linkType: 'internal',
          destinationPageId: caseStudiesPage?._id,
          destinationUrl: '/case-studies',
          anchorText: 'Verified Client Case Studies & Results',
          placement: 'content_body',
          relAttribute: 'follow',
          targetAttribute: '_self',
          status: 'active',
          validationStatus: 'working',
          httpStatusCode: 200,
        },
        {
          sourcePageId: homePage._id,
          linkType: 'internal',
          destinationPageId: pricingPage?._id,
          destinationUrl: '/pricing',
          anchorText: 'Transparent Project Pricing Plans',
          placement: 'related_links',
          relAttribute: 'follow',
          targetAttribute: '_self',
          status: 'active',
          validationStatus: 'working',
          httpStatusCode: 200,
        },
        {
          sourcePageId: homePage._id,
          linkType: 'internal',
          destinationPageId: contactPage?._id,
          destinationUrl: '/contact',
          anchorText: 'Schedule a Consultation',
          placement: 'content_bottom',
          relAttribute: 'follow',
          targetAttribute: '_self',
          status: 'active',
          validationStatus: 'working',
          httpStatusCode: 200,
        },
        {
          sourcePageId: homePage._id,
          linkType: 'external',
          destinationUrl: 'https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps',
          websiteName: 'MDN Web Docs',
          anchorText: 'Modern Progressive Web Application Architecture (MDN)',
          placement: 'content_body',
          relAttribute: 'nofollow',
          targetAttribute: '_blank',
          status: 'active',
          validationStatus: 'working',
          httpStatusCode: 200,
        },
        {
          sourcePageId: homePage._id,
          linkType: 'external',
          destinationUrl: 'https://web.dev/vitals/',
          websiteName: 'Google web.dev',
          anchorText: 'Core Web Vitals Best Practices',
          placement: 'content_bottom',
          relAttribute: 'nofollow',
          targetAttribute: '_blank',
          status: 'active',
          validationStatus: 'working',
          httpStatusCode: 200,
        },
      ];

      if (aboutPage) {
        initialLinks.push(
          {
            sourcePageId: aboutPage._id,
            linkType: 'internal',
            destinationPageId: servicesPage?._id,
            destinationUrl: '/services',
            anchorText: 'Our Full Range of Digital Capabilities',
            placement: 'content_body',
            relAttribute: 'follow',
            targetAttribute: '_self',
            status: 'active',
            validationStatus: 'working',
            httpStatusCode: 200,
          },
          {
            sourcePageId: aboutPage._id,
            linkType: 'internal',
            destinationPageId: contactPage?._id,
            destinationUrl: '/contact',
            anchorText: 'Contact Our Engineering Leadership',
            placement: 'content_bottom',
            relAttribute: 'follow',
            targetAttribute: '_self',
            status: 'active',
            validationStatus: 'working',
            httpStatusCode: 200,
          },
          {
            sourcePageId: aboutPage._id,
            linkType: 'external',
            destinationUrl: 'https://www.w3.org/WAI/standards-guidelines/wcag/',
            websiteName: 'W3C Web Accessibility Initiative',
            anchorText: 'W3C WCAG Accessibility Standards',
            placement: 'content_body',
            relAttribute: 'nofollow',
            targetAttribute: '_blank',
            status: 'active',
            validationStatus: 'working',
            httpStatusCode: 200,
          }
        );
      }

      await SeoLink.insertMany(initialLinks);
    }
  }

  // Audit all pages once to populate baseline audit scores
  const allPages = await WebsitePage.find();
  for (const page of allPages) {
    const pageLinks = await SeoLink.find({ sourcePageId: page._id });
    const auditResult = calculatePageSeoScore(page, pageLinks);

    await WebsitePage.findByIdAndUpdate(page._id, {
      lastAuditScore: auditResult.score,
      lastScoreCategory: auditResult.scoreCategory,
      lastAuditedAt: new Date(),
    });

    await SeoLinkAudit.create({
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
  }
};

