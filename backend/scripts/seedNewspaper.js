import Newspaper from '../models/Newspaper.js';

export const seedNewspaper = async () => {
  try {
    const count = await Newspaper.countDocuments();
    if (count > 0) {
      console.log(`[Seed] Newspaper articles already initialized: (${count} entries found)`);
      return;
    }

    console.log('[Seed] No newspaper entries found in MongoDB. Seeding initial VR4Web newspaper publication...');

    const initialNewspapers = [
      {
        title: 'Estimated Website Pricing',
        description:
          'A complete breakdown of website development pricing in India, including costs, timelines, and what is included.',
        image: {
          url: '/white-paper.png',
          alt: 'Estimated Website Pricing Whitepaper',
        },
        imageUrl: '/white-paper.png',
        pdf: {
          url: '/white-paper/white-1.pdf',
          fileName: 'VR4Web-Estimated-Website-Pricing-Whitepaper.pdf',
          fileSize: 2516582, // ~2.4 MB
        },
        pdfUrl: '/white-paper/white-1.pdf',
        fileName: 'VR4Web-Estimated-Website-Pricing-Whitepaper.pdf',
        fileSize: 2516582,
        status: 'published',
        publishedAt: new Date('2026-10-01T10:00:00Z'),
        downloads: 142,
      },
    ];

    await Newspaper.insertMany(initialNewspapers);
    console.log(`[Seed] Successfully seeded ${initialNewspapers.length} initial newspaper entries into MongoDB.`);
  } catch (err) {
    console.error(`[Seed] Newspaper seed error: ${err.message}`);
  }
};

export default seedNewspaper;

