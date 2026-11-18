import Gallery from '../models/Gallery.js';

export const seedGallery = async () => {
  try {
    const count = await Gallery.countDocuments();
    if (count > 0) {
      console.log(`[Seed] Gallery assets already initialized: (${count} items found)`);
      // Update any existing records missing isFeatured or displayOrder
      const missingFeatured = await Gallery.countDocuments({ isFeatured: { $exists: false } });
      if (missingFeatured > 0) {
        console.log(`[Seed] Updating ${missingFeatured} existing gallery records with default featured & displayOrder...`);
        const items = await Gallery.find({}).sort({ order: 1, createdAt: 1 });
        for (let i = 0; i < items.length; i++) {
          const it = items[i];
          if (it.isFeatured === undefined) {
            it.isFeatured = i < 12; // Feature top 12 items on homepage by default
          }
          if (it.displayOrder === undefined || it.displayOrder === 0) {
            it.displayOrder = it.order || i + 1;
          }
          await it.save();
        }
      }
      return;
    }

    console.log('[Seed] No gallery items found in MongoDB. Seeding initial portfolio gallery items...');

    const initialGalleryItems = [
      {
        title: 'Answer Engine Optimization',
        description: 'Helping businesses improve visibility across AI-powered search engines.',
        caption: 'Helping businesses improve visibility across AI-powered search engines.',
        category: 'Digital Marketing',
        imageUrl: '/services-images-set2/aeo.png',
        image: { url: '/services-images-set2/aeo.png', alt: 'Answer Engine Optimization' },
        status: 'published',
        isDeleted: false,
        order: 1,
        displayOrder: 1,
        isFeatured: true,
        publishedAt: new Date(),
      },
      {
        title: 'Content Marketing',
        description: 'Creating engaging content that connects brands with their audiences.',
        caption: 'Creating engaging content that connects brands with their audiences.',
        category: 'Digital Marketing',
        imageUrl: '/services-images-set2/content.png',
        image: { url: '/services-images-set2/content.png', alt: 'Content Marketing' },
        status: 'published',
        isDeleted: false,
        order: 2,
        displayOrder: 2,
        isFeatured: true,
        publishedAt: new Date(),
      },
      {
        title: 'Flutter App Development',
        description: 'Building cross-platform mobile applications with Flutter.',
        caption: 'Building cross-platform mobile applications with Flutter.',
        category: 'App',
        imageUrl: '/services-section-home-page/app-development/flutter.png',
        image: { url: '/services-section-home-page/app-development/flutter.png', alt: 'Flutter App Development' },
        status: 'published',
        isDeleted: false,
        order: 3,
        displayOrder: 3,
        isFeatured: true,
        publishedAt: new Date(),
      },
      {
        title: 'iOS App Development',
        description: 'Developing intuitive and high-performance applications for iOS.',
        caption: 'Developing intuitive and high-performance applications for iOS.',
        category: 'App',
        imageUrl: '/services-section-home-page/app-development/iOS Development.png',
        image: { url: '/services-section-home-page/app-development/iOS Development.png', alt: 'iOS App Development' },
        status: 'published',
        isDeleted: false,
        order: 4,
        displayOrder: 4,
        isFeatured: true,
        publishedAt: new Date(),
      },
      {
        title: 'Shopify Development',
        description: 'Creating scalable Shopify stores with seamless shopping experiences.',
        caption: 'Creating scalable Shopify stores with seamless shopping experiences.',
        category: 'Web Development',
        imageUrl: '/services-section-home-page/E-commerce Solutions/Shopify Development Solutions.png',
        image: { url: '/services-section-home-page/E-commerce Solutions/Shopify Development Solutions.png', alt: 'Shopify Development' },
        status: 'published',
        isDeleted: false,
        order: 5,
        displayOrder: 5,
        isFeatured: true,
        publishedAt: new Date(),
      },
      {
        title: 'Software Integration',
        description: 'Connecting business systems for smoother workflows and operations.',
        caption: 'Connecting business systems for smoother workflows and operations.',
        category: 'Web Development',
        imageUrl: '/services-section-home-page/Software Application Development/Software Integration.png',
        image: { url: '/services-section-home-page/Software Application Development/Software Integration.png', alt: 'Software Integration' },
        status: 'published',
        isDeleted: false,
        order: 6,
        displayOrder: 6,
        isFeatured: true,
        publishedAt: new Date(),
      },
      {
        title: 'Digital Marketing',
        description: 'Driving online growth through targeted digital marketing strategies.',
        caption: 'Driving online growth through targeted digital marketing strategies.',
        category: 'Digital Marketing',
        imageUrl: '/services-images-set2/digital-marketing.png',
        image: { url: '/services-images-set2/digital-marketing.png', alt: 'Digital Marketing' },
        status: 'published',
        isDeleted: false,
        order: 7,
        displayOrder: 7,
        isFeatured: true,
        publishedAt: new Date(),
      },
      {
        title: 'White Hat SEO',
        description: 'Improving organic search rankings through ethical SEO practices.',
        caption: 'Improving organic search rankings through ethical SEO practices.',
        category: 'Digital Marketing',
        imageUrl: '/services-images-set2/white-hat-seo.png',
        image: { url: '/services-images-set2/white-hat-seo.png', alt: 'White Hat SEO' },
        status: 'published',
        isDeleted: false,
        order: 8,
        displayOrder: 8,
        isFeatured: true,
        publishedAt: new Date(),
      },
      {
        title: 'Web Portal Development',
        description: 'Building secure and responsive enterprise web portals.',
        caption: 'Building secure and responsive enterprise web portals.',
        category: 'Web Development',
        imageUrl: '/services-images-set2/web-portal.png',
        image: { url: '/services-images-set2/web-portal.png', alt: 'Web Portal Development' },
        status: 'published',
        isDeleted: false,
        order: 9,
        displayOrder: 9,
        isFeatured: true,
        publishedAt: new Date(),
      },
      {
        title: 'SaaS Architecture',
        description: 'Architecting scalable cloud-native multi-tenant SaaS platforms.',
        caption: 'Architecting scalable cloud-native multi-tenant SaaS platforms.',
        category: 'Web Development',
        imageUrl: '/services-images-set2/saas.png',
        image: { url: '/services-images-set2/saas.png', alt: 'SaaS Architecture' },
        status: 'published',
        isDeleted: false,
        order: 10,
        displayOrder: 10,
        isFeatured: true,
        publishedAt: new Date(),
      },
      {
        title: 'UI/UX Design Services',
        description: 'Crafting modern, intuitive, and conversion-focused user interfaces.',
        caption: 'Crafting modern, intuitive, and conversion-focused user interfaces.',
        category: 'UI/UX',
        imageUrl: '/services-images-set2/ui-ux.png',
        image: { url: '/services-images-set2/ui-ux.png', alt: 'UI/UX Design Services' },
        status: 'published',
        isDeleted: false,
        order: 11,
        displayOrder: 11,
        isFeatured: true,
        publishedAt: new Date(),
      },
      {
        title: 'ORM Services',
        description: 'Protecting and elevating your brand reputation across the digital sphere.',
        caption: 'Protecting and elevating your brand reputation across the digital sphere.',
        category: 'Digital Marketing',
        imageUrl: '/services-images-set2/orm.png',
        image: { url: '/services-images-set2/orm.png', alt: 'ORM Services' },
        status: 'published',
        isDeleted: false,
        order: 12,
        displayOrder: 12,
        isFeatured: true,
        publishedAt: new Date(),
      },
    ];

    await Gallery.insertMany(initialGalleryItems);
    console.log(`[Seed] Successfully seeded ${initialGalleryItems.length} portfolio gallery items into MongoDB.`);
  } catch (error) {
    console.error('[Seed] Error seeding gallery items:', error.message);
  }
};
