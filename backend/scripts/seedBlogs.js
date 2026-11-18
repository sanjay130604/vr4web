import Blog from '../models/Blog.js';

export const seedBlogs = async () => {
  try {
    const count = await Blog.countDocuments();
    if (count > 0) {
      console.log(`[Seed] Blogs already initialized: (${count} articles found)`);
      return;
    }

    console.log('[Seed] No blogs found in MongoDB. Seeding initial VR4Web blogs...');

    const initialBlogs = [
      {
        title: 'Mobile Application Development Services for Modern Businesses',
        slug: 'mobile-application-development-services',
        category: 'Mobile Development',
        author: 'VR4Web Technology Team',
        readTime: '6 min read',
        summary:
          'Mobile applications have become an indispensable pillar of how modern businesses connect with customers, manage operations, deliver services, and build digital experiences.',
        imageUrl: '/blogs/mobile-app-services.png',
        featuredImage: {
          url: '/blogs/mobile-app-services.png',
          alt: 'Mobile Application Development Services for Modern Businesses',
        },
        contentType: 'manual',
        tags: ['Mobile Apps', 'React Native', 'iOS', 'Android', 'Enterprise'],
        status: 'published',
        isFeatured: true,
        publishedAt: new Date('2026-09-30T10:00:00Z'),
        sections: [
          {
            heading: 'Summary & Overview',
            subheading: 'Why mobile-first strategies drive enterprise longevity',
            body:
              'Mobile applications have become an indispensable pillar of how modern businesses connect with customers, manage operations, deliver services, and build meaningful digital experiences.\n\nIn today’s hyper-connected marketplace, having a mobile-first strategy is no longer a luxury—it is an operational requirement. Consumers and enterprise users alike expect rapid, intuitive, and secure interactions at their fingertips, whether purchasing a product, managing logistics, or accessing real-time customer support.',
            order: 1,
          },
          {
            heading: 'Technical Evolution & Architecture',
            subheading: 'Cloud-native mobile backends and reactive frontends',
            body:
              'Over the past decade, enterprise applications transitioned from monolithic codebases into modular, cloud-native services. Organizations that invested in modern mobile-first ecosystems unlocked rapid time-to-market, resilient uptime, and sustained customer lifetime value.\n\nModern engineering standards prioritize sub-second interface responses, end-to-end encrypted transactions, and automated telemetry that delivers predictable business ROI.',
            order: 2,
          },
          {
            heading: 'Core Frameworks & Implementation',
            subheading: 'Native and cross-platform multi-tier architectures',
            body:
              'We architect scalable mobile ecosystems using modern, battle-tested software stacks that guarantee long-term stability and effortless maintainability:\n\n• Custom iOS & Android App Development: High-performance native applications engineered with Swift and Kotlin.\n• Cross-Platform & Hybrid Solutions: Cost-effective, single-codebase architectures powered by React Native and Flutter, cutting time-to-market by up to 40%.\n• UI/UX Design for Mobile: Research-driven wireframing and frictionless user journeys.\n• Continuous Maintenance & CI/CD: Automated Fastlane deployment and telemetry monitoring.',
            order: 3,
          },
        ],
        content: `
<h2>Summary & Overview</h2>
<p>Mobile applications have become an indispensable pillar of how modern businesses connect with customers, manage operations, deliver services, and build meaningful digital experiences.</p>
<p>In today's hyper-connected marketplace, having a mobile-first strategy is an operational requirement. Consumers and enterprise users alike expect rapid, intuitive, and secure interactions at their fingertips.</p>
<h2>Technical Evolution & Architecture</h2>
<p>Modern engineering standards prioritize sub-second interface responses, end-to-end encrypted transactions, and automated telemetry that delivers predictable business ROI.</p>
<h2>Core Frameworks & Implementation</h2>
<p>We architect scalable mobile ecosystems using modern, battle-tested software stacks including React Native, Flutter, Swift, and Kotlin paired with Node.js and cloud-native databases.</p>
`,
      },
      {
        title: 'How Mobile Applications Drive Superior Digital Experiences',
        slug: 'mobile-apps-better-digital-experiences',
        category: 'Digital Experience',
        author: 'VR4Web Insights',
        readTime: '7 min read',
        summary:
          'Exploring the UX principles, micro-interactions, and real-time responsiveness that separate market-leading mobile apps from standard web portals.',
        imageUrl: '/blogs/mobile-digital-experiences.png',
        featuredImage: {
          url: '/blogs/mobile-digital-experiences.png',
          alt: 'How Mobile Applications Drive Superior Digital Experiences',
        },
        contentType: 'manual',
        tags: ['UI/UX', 'Digital Experience', 'Mobile Design', 'Performance'],
        status: 'published',
        isFeatured: false,
        publishedAt: new Date('2026-10-15T10:00:00Z'),
        sections: [
          {
            heading: 'User-Centric Architecture',
            subheading: 'Streamlined touchpoints and omnichannel experience optimization',
            body:
              'A truly exceptional digital experience is defined by how effortlessly users accomplish their intended tasks. Mobile devices offer unique hardware affordances—haptic feedback, biometrics, gestures—that enable delightful micro-interactions when implemented thoughtfully.',
            order: 1,
          },
          {
            heading: 'Sub-Second Latency & Offline Capability',
            subheading: 'Ensuring business continuity in low-connectivity environments',
            body:
              'Unlike traditional browser tabs that require active internet connections, modern mobile applications utilize local data storage and optimistic UI updates to ensure users never experience frozen screens or lost progress.',
            order: 2,
          },
        ],
        content: `
<h2>User-Centric Architecture</h2>
<p>A truly exceptional digital experience is defined by how effortlessly users accomplish their intended tasks. Mobile devices offer unique hardware affordances that enable delightful micro-interactions when implemented thoughtfully.</p>
<h2>Sub-Second Latency & Offline Capability</h2>
<p>Unlike traditional browser tabs, modern mobile applications utilize local data storage and optimistic UI updates to ensure users never experience frozen screens or lost progress.</p>
`,
      },
      {
        title: 'How Unified ERP & CRM Architectures Transform Modern eCommerce',
        slug: 'erp-crm-transform-ecommerce-operations',
        category: 'Enterprise Systems',
        author: 'VR4Web Architecture Guild',
        readTime: '8 min read',
        summary:
          'Synchronizing distributed inventory, customer lifecycles, and predictive fulfillment with cloud-native ERP & CRM orchestration.',
        imageUrl: '/blogs/erp-crm-ecommerce.png',
        featuredImage: {
          url: '/blogs/erp-crm-ecommerce.png',
          alt: 'How Unified ERP & CRM Architectures Transform Modern eCommerce',
        },
        contentType: 'manual',
        tags: ['ERP', 'CRM', 'eCommerce', 'Architecture', 'Cloud'],
        status: 'published',
        isFeatured: false,
        publishedAt: new Date('2026-10-22T10:00:00Z'),
        sections: [
          {
            heading: 'The Power of Unified Operations',
            subheading: 'Bridging the gap between warehouse logistics and customer front-ends',
            body:
              'Fragmented software stacks cost scaling eCommerce brands hundreds of thousands in operational discrepancies. Connecting inventory telemetry directly with marketing automation ensures stockouts are prevented and high-margin customers receive VIP fulfillment.',
            order: 1,
          },
          {
            heading: 'Automated Pipeline Orchestration',
            subheading: 'Real-time event streaming and scalable microservices',
            body:
              'With event-driven webhooks and reliable message brokers, every order placed on the storefront updates supplier POs, tracks shipping milestones, and logs lifetime value metrics without manual human intervention.',
            order: 2,
          },
        ],
        content: `
<h2>The Power of Unified Operations</h2>
<p>Fragmented software stacks cost scaling eCommerce brands hundreds of thousands in operational discrepancies. Connecting inventory telemetry directly with marketing automation ensures stockouts are prevented.</p>
<h2>Automated Pipeline Orchestration</h2>
<p>With event-driven webhooks and reliable message brokers, every order placed on the storefront updates supplier POs, tracks shipping milestones, and logs lifetime value metrics without manual human intervention.</p>
`,
      },
    ];

    await Blog.insertMany(initialBlogs);
    console.log(`[Seed] Successfully seeded ${initialBlogs.length} initial blogs into MongoDB.`);
  } catch (err) {
    console.error('[Seed] Error seeding blogs:', err.message);
  }
};

