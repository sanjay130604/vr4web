import Story from '../models/Story.js';
import Blog from '../models/Blog.js';
import Newspaper from '../models/Newspaper.js';
import Gallery from '../models/Gallery.js';
import CaseStudy from '../models/CaseStudy.js';
import ContactLead from '../models/ContactLead.js';
import EnquiryLead from '../models/EnquiryLead.js';
import PricingPackage from '../models/PricingPackage.js';

export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalStories,
      totalBlogs,
      publishedBlogs,
      totalNewspaper,
      totalGallery,
      totalCaseStudies,
      totalContactLeads,
      newContactLeads,
      totalEnquiryLeads,
      newEnquiryLeads,
      totalPricing,
      publishedPricing,
    ] = await Promise.all([
      Story.countDocuments(),
      Blog.countDocuments(),
      Blog.countDocuments({ status: 'published' }),
      Newspaper.countDocuments({ status: { $ne: 'trash' } }),
      Gallery.countDocuments({ isDeleted: { $ne: true } }),
      CaseStudy.countDocuments(),
      ContactLead.countDocuments({ isDeleted: { $ne: true } }),
      ContactLead.countDocuments({ isDeleted: { $ne: true }, status: 'New' }),
      EnquiryLead.countDocuments({ isDeleted: { $ne: true } }),
      EnquiryLead.countDocuments({ isDeleted: { $ne: true }, status: 'New' }),
      PricingPackage.countDocuments(),
      PricingPackage.countDocuments({ status: 'Published' }),
    ]);

    const [
      recentStories,
      recentBlogs,
      recentNewspaper,
      recentCaseStudies,
      recentContactLeads,
      recentEnquiryLeads,
    ] = await Promise.all([
      Story.find().sort({ createdAt: -1 }).limit(4).select('title status createdAt category'),
      Blog.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .select('title slug category author readTime status publishedDate featuredImage imageUrl summary metaDescription createdAt'),
      Newspaper.find({ status: { $ne: 'trash' } })
        .sort({ createdAt: -1 })
        .limit(4)
        .select('title publisher status date createdAt imageFile pdfFile'),
      CaseStudy.find()
        .sort({ createdAt: -1 })
        .limit(6)
        .select('title slug clientName industry category status featuredImage createdAt shortDescription summary description'),
      ContactLead.find({ isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(8)
        .select('name email phone phoneCode subject status createdAt'),
      EnquiryLead.find({ isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(8)
        .select('name email phone countryCode company projectType projectBudget status createdAt'),
    ]);

    res.status(200).json({
      success: true,
      // Section 8 requested keys
      caseStudies: totalCaseStudies,
      blogs: totalBlogs,
      publishedBlogs: publishedBlogs,
      newspapers: totalNewspaper,
      galleryImages: totalGallery,
      contactLeads: totalContactLeads,
      enquiryLeads: totalEnquiryLeads,
      newContactLeads: newContactLeads,
      newEnquiryLeads: newEnquiryLeads,
      totalPricingPackages: totalPricing,
      publishedPricingPackages: publishedPricing,
      recentCaseStudies,
      recentBlogs,
      recentContactLeads,
      recentEnquiryLeads,
      // Backward compatibility keys
      stats: {
        totalStories,
        totalBlogs,
        publishedBlogs,
        totalNewspaper,
        totalGallery,
        totalCaseStudies,
        totalContactLeads,
        newContactLeads,
        totalEnquiryLeads,
        newEnquiryLeads,
      },
      recentActivity: [
        ...recentContactLeads.map((item) => ({
          ...item.toObject(),
          title: `Contact: ${item.name} (${item.subject || 'Inquiry'})`,
          type: 'Contact Lead',
        })),
        ...recentEnquiryLeads.map((item) => ({
          ...item.toObject(),
          title: `Enquiry: ${item.name} (${item.projectType || 'Project'})`,
          type: 'Enquiry Lead',
        })),
        ...recentCaseStudies.map((item) => ({ ...item.toObject(), type: 'Case Study' })),
        ...recentStories.map((item) => ({ ...item.toObject(), type: 'Story' })),
        ...recentBlogs.map((item) => ({ ...item.toObject(), type: 'Blog' })),
        ...recentNewspaper.map((item) => ({ ...item.toObject(), type: 'Press' })),
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
