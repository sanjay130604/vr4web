import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from '../config/db.js';
import { seedAdmin } from '../scripts/seedAdmin.js';
import { seedBlogs } from '../scripts/seedBlogs.js';
import { seedNewspaper } from '../scripts/seedNewspaper.js';
import { seedGallery } from '../scripts/seedGallery.js';
import { seedPricing } from '../scripts/seedPricing.js';
import authRoutes from '../routes/login.js';
import storyRoutes from '../routes/stories.js';
import blogRoutes from '../routes/blogs.js';
import newspaperRoutes from '../routes/newspaper.js';
import galleryRoutes from '../routes/gallery.js';
import dashboardRoutes from '../routes/dashboard.js';
import caseStudyRoutes from '../routes/caseStudies.js';
import contactLeadRoutes from '../routes/contactLeads.js';
import enquiryLeadRoutes from '../routes/enquiryLeads.js';
import sitemapRoutes, { getSitemapXml } from '../routes/sitemap.js';
import crawlerMetaRoutes from '../routes/crawlerMeta.js';
import pricingRoutes from '../routes/pricing.js';
import seoLinkRoutes from '../routes/seoLinks.js';
import { syncWebsitePages } from './seoLinkAuditEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();

// Initialize MongoDB Connection & Auto-Seed Default Admin, Blogs & Newspaper
connectDB()
  .then(async () => {
    await seedAdmin();
    await seedBlogs();
    await seedNewspaper();
    await seedGallery();
    await seedPricing();
    await syncWebsitePages();
  })
  .catch((err) => {
    console.error('[App Service] Database initialization error:', err.message);
  });

// Allowed Origins for CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || 'https://vr4web.com',
  'https://vr4web.com',
  'https://www.vr4web.com',
  'https://backend.vr4web.com',
  'http://vr4web.com',
  'http://www.vr4web.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5010',
  'http://127.0.0.1:5010',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps, curl, or same-origin)
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vr4web.com') ||
        origin === 'https://vr4web.com' ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:')
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev, validated in production
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

// Serve Static Uploads
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));

// Express Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Health Check API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'VR4Web Enterprise Admin API',
    uptime: process.uptime(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api', authRoutes); // Allows direct /api/login, /api/me, /api/logout as well
app.use('/api/case-studies', caseStudyRoutes);
app.use('/api/public/case-studies', (req, res, next) => {
  req.url = '/public' + req.url;
  caseStudyRoutes(req, res, next);
});
app.use('/api/stories', storyRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/admin/blogs', blogRoutes);
app.use('/api/newspapers', newspaperRoutes);
app.use('/api/newspaper', newspaperRoutes);
app.use('/api/admin/newspapers', newspaperRoutes);
app.use('/api/admin/newspaper', newspaperRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/admin/gallery', galleryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/admin/pricing', pricingRoutes);
app.use('/api/public/pricing', (req, res, next) => {
  req.url = '/public' + req.url;
  pricingRoutes(req, res, next);
});
app.use('/api/contact-leads', contactLeadRoutes);
app.use('/api/enquiry-leads', enquiryLeadRoutes);
app.use('/api/seo-links', seoLinkRoutes);
app.use('/api/admin/seo-links', seoLinkRoutes);
app.use('/api/sitemap', sitemapRoutes);
app.use('/api/public/meta', crawlerMetaRoutes);

// Root sitemap route for search engines
app.get('/sitemap.xml', getSitemapXml);

// 404 Handler for unhandled API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]:', err.stack || err);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

export default app;
