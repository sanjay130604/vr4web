import PricingPackage from '../models/PricingPackage.js';

export const seedPricing = async () => {
  try {
    const existingCount = await PricingPackage.countDocuments();
    if (existingCount > 0) {
      console.log(`[Seed] Pricing packages already exist (${existingCount} packages). Skipping auto-seed.`);
      return;
    }

    const defaultPackages = [
      // ─── Website Development Packages ───
      {
        packageName: 'Starter Web',
        tagline: 'Ideal for small offices, startups & local businesses.',
        description: 'A rapid, conversion-focused responsive website designed to build immediate credibility and capture qualified customer inquiries.',
        price: 4999,
        duration: 1,
        durationType: 'Years',
        buttonText: 'Get Started',
        listingType: 'Standard',
        badge: 'None',
        customBadgeText: '',
        accentColor: '#2563EB',
        isFeatured: false,
        isHighlighted: false,
        isActive: true,
        category: 'Website Development Packages',
        targetAudience: 'Startups, Consultants, and Local Service Providers',
        displayOrder: 1,
        status: 'Published',
        ctaType: 'enquiry',
        features: [
          { name: '5 Mobile-Responsive Custom Pages', description: 'Handcrafted HTML5/Tailwind layout', isIncluded: true, displayOrder: 1 },
          { name: 'Fast Turnaround (5–7 Business Days)', description: 'Accelerated production pipeline', isIncluded: true, displayOrder: 2 },
          { name: 'Lead Contact Form & WhatsApp Button', description: 'Instant prospect notification', isIncluded: true, displayOrder: 3 },
          { name: 'Basic Search Engine Optimization (SEO)', description: 'Meta tags, schema & sitemap', isIncluded: true, displayOrder: 4 },
          { name: 'Free SSL Certificate & Hosting Setup', description: 'Enterprise security encryption', isIncluded: true, displayOrder: 5 },
          { name: '1 Year Domain & Cloud Hosting', description: '99.9% uptime SLA hosting', isIncluded: true, displayOrder: 6 },
          { name: 'Dedicated Account Manager', description: 'Direct Slack & phone channel', isIncluded: false, displayOrder: 7 },
          { name: 'E-commerce & Payment Gateway', description: 'Cart, checkout and invoicing', isIncluded: false, displayOrder: 8 },
        ],
      },
      {
        packageName: 'Professional Business',
        tagline: 'Maximum visibility, authority, and lead generation.',
        description: 'Comprehensive digital infrastructure engineered for expanding companies requiring custom design, high-speed performance, and multi-channel lead funnels.',
        price: 14999,
        duration: 1,
        durationType: 'Years',
        buttonText: 'Claim Your Plan',
        listingType: 'Featured',
        badge: 'Popular',
        customBadgeText: 'Most Popular',
        accentColor: '#E8890C', // Gold / Amber
        isFeatured: true,
        isHighlighted: true,
        isActive: true,
        category: 'Website Development Packages',
        targetAudience: 'Growing SMEs, Tech Agencies, and Professional Firms',
        displayOrder: 2,
        status: 'Published',
        ctaType: 'enquiry',
        features: [
          { name: 'Up to 15 Dynamic Responsive Pages', description: 'Custom corporate design system', isIncluded: true, displayOrder: 1 },
          { name: 'CMS & Dynamic Blog Article Engine', description: 'Self-serve content publishing', isIncluded: true, displayOrder: 2 },
          { name: 'Advanced AEO & AI SEO Architecture', description: 'Optimized for Perplexity, Gemini, ChatGPT', isIncluded: true, displayOrder: 3 },
          { name: 'Interactive Enquiry Lead Capture System', description: 'Direct CRM sync & email alerts', isIncluded: true, displayOrder: 4 },
          { name: 'High-Speed Global CDN & Ultra SSL', description: 'Sub-second load times worldwide', isIncluded: true, displayOrder: 5 },
          { name: 'Google Analytics 4 & Tag Manager Sync', description: 'Real-time conversion tracking', isIncluded: true, displayOrder: 6 },
          { name: 'Priority Technical Support (12 Months)', description: 'Response within 4 business hours', isIncluded: true, displayOrder: 7 },
          { name: 'Custom ERP / CRM API Integration', description: 'Custom bridge for existing software', isIncluded: false, displayOrder: 8 },
        ],
      },
      {
        packageName: 'Enterprise Commerce',
        tagline: 'High-volume storefronts and full-stack software applications.',
        description: 'Tailored enterprise-grade portal featuring scalable database architecture, multi-tenant authentication, and headless commerce workflows.',
        price: 29999,
        duration: 1,
        durationType: 'Years',
        buttonText: 'Schedule Consultation',
        listingType: 'Premium',
        badge: 'Best Value',
        customBadgeText: 'Best Value',
        accentColor: '#0F3D2E', // Deep Emerald
        isFeatured: false,
        isHighlighted: false,
        isActive: true,
        category: 'Website Development Packages',
        targetAudience: 'Enterprise Brands, E-Commerce Portals, and SaaS Platforms',
        displayOrder: 3,
        status: 'Published',
        ctaType: 'contact',
        features: [
          { name: 'Unlimited Pages & Scalable Headless Architecture', description: 'Next.js / React microfrontends', isIncluded: true, displayOrder: 1 },
          { name: 'Complete E-Commerce / Custom Portal', description: 'Cart, Stripe, Razorpay & invoicing', isIncluded: true, displayOrder: 2 },
          { name: 'Multi-Role Admin & RBAC Dashboard', description: 'Custom enterprise backoffice', isIncluded: true, displayOrder: 3 },
          { name: 'Automated Daily Backups & Disaster Recovery', description: 'Enterprise RTO/RPO guarantee', isIncluded: true, displayOrder: 4 },
          { name: 'Dedicated Senior Software Architect', description: 'Monthly strategic engineering review', isIncluded: true, displayOrder: 5 },
          { name: 'Continuous Security Audits & Pen-Testing', description: 'OWASP Top 10 compliance', isIncluded: true, displayOrder: 6 },
          { name: '24/7/365 Emergency SLA Support', description: '15-minute response time', isIncluded: true, displayOrder: 7 },
          { name: 'Custom AI Assistant & Knowledge Bot', description: 'Trained on company documentation', isIncluded: true, displayOrder: 8 },
        ],
      },

      // ─── Business Packages ───
      {
        packageName: 'Growth Marketing Suite',
        tagline: 'Accelerate qualified inbound pipeline with data-driven campaigns.',
        description: 'Multi-channel acquisition engine covering high-intent Google search, LinkedIn ABM funnels, and answer engine optimization.',
        price: 34999,
        duration: 1,
        durationType: 'Months',
        buttonText: 'Scale Your Pipeline',
        listingType: 'Standard',
        badge: 'Recommended',
        customBadgeText: 'Recommended',
        accentColor: '#2563EB',
        isFeatured: false,
        isHighlighted: false,
        isActive: true,
        category: 'Business Packages',
        targetAudience: 'B2B Companies and High-Growth Scale-Ups',
        displayOrder: 4,
        status: 'Published',
        ctaType: 'enquiry',
        features: [
          { name: 'Omnichannel B2B Campaign Management', description: 'Google Ads & LinkedIn ABM targeting', isIncluded: true, displayOrder: 1 },
          { name: 'Conversion Rate Optimization (CRO)', description: 'Bi-weekly A/B landing page tests', isIncluded: true, displayOrder: 2 },
          { name: '4 Technical Thought Leadership White Papers', description: 'Engineered for enterprise buyer intent', isIncluded: true, displayOrder: 3 },
          { name: 'Bi-Weekly Executive Performance Reviews', description: 'ROAS & pipeline attribution metrics', isIncluded: true, displayOrder: 4 },
          { name: 'Full Inbound Funnel CRM Automation', description: 'HubSpot / Zoho integration', isIncluded: true, displayOrder: 5 },
        ],
      },
      {
        packageName: 'Custom Enterprise Advisory',
        tagline: 'Tailored digital transformation and fractional CTO services.',
        description: 'Bespoke corporate engagement model designed for legacy migration, microservice restructuring, and compliance-first software architecture.',
        price: 99999,
        duration: 1,
        durationType: 'Custom',
        buttonText: 'Speak with Leadership',
        listingType: 'Premium',
        badge: 'Limited Offer',
        customBadgeText: 'Bespoke',
        accentColor: '#7C3AED',
        isFeatured: true,
        isHighlighted: true,
        isActive: true,
        category: 'Business Packages',
        targetAudience: 'Established Corporations, Government, and Financial Institutions',
        displayOrder: 5,
        status: 'Published',
        ctaType: 'contact',
        features: [
          { name: 'Dedicated Engineering Squad & Tech Lead', description: 'Full-stack agile scrum team', isIncluded: true, displayOrder: 1 },
          { name: 'Custom Cloud Infrastructure & DevOps CI/CD', description: 'AWS / Azure Terraform scripts', isIncluded: true, displayOrder: 2 },
          { name: 'ISO / SOC 2 Compliance Roadmapping', description: 'Enterprise data governance', isIncluded: true, displayOrder: 3 },
          { name: 'Direct C-Suite Strategic Consulting', description: 'Quarterly roadmap presentations', isIncluded: true, displayOrder: 4 },
        ],
      },
    ];

    await PricingPackage.insertMany(defaultPackages);
    console.log(`[Seed] Successfully seeded ${defaultPackages.length} default VR4Web pricing packages.`);
  } catch (error) {
    console.error('[Seed] seedPricing error:', error.message);
  }
};

export default seedPricing;

