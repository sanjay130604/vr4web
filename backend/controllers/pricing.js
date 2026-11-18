import PricingPackage from '../models/PricingPackage.js';

/**
 * @desc Get all pricing packages for Admin Dashboard (with filters, search & sorting)
 * @route GET /api/pricing
 * @access Private (Admin)
 */
export const getAdminPricingPackages = async (req, res) => {
  try {
    const {
      search,
      status,
      listingType,
      durationType,
      category,
      sortBy = 'displayOrder',
      sortOrder = 'asc',
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    // Text search by package name, tagline, or description
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { packageName: searchRegex },
        { tagline: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
      ];
    }

    // Filter by publication status
    if (status && status !== 'All') {
      query.status = status;
    }

    // Filter by listing type
    if (listingType && listingType !== 'All') {
      query.listingType = listingType;
    }

    // Filter by duration type
    if (durationType && durationType !== 'All') {
      query.durationType = durationType;
    }

    // Filter by category
    if (category && category !== 'All') {
      query.category = category;
    }

    // Sorting
    const sortField = sortBy === 'price' ? 'price' : sortBy === 'createdAt' ? 'createdAt' : 'displayOrder';
    const sortDirection = sortOrder === 'desc' ? -1 : 1;
    const sortObj = { [sortField]: sortDirection };
    if (sortField !== '_id') {
      sortObj._id = 1;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [packages, totalCount] = await Promise.all([
      PricingPackage.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      PricingPackage.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum) || 1;

    return res.status(200).json({
      success: true,
      data: packages,
      packages,
      count: packages.length,
      totalCount,
      total: totalCount,
      totalPages,
      currentPage: pageNum,
      pagination: {
        currentPage: pageNum,
        page: pageNum,
        limit: limitNum,
        pageSize: limitNum,
        totalRecords: totalCount,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error('[Pricing Controller] getAdminPricingPackages error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve pricing packages: ' + error.message,
    });
  }
};

/**
 * @desc Get summary statistics for Admin Dashboard
 * @route GET /api/pricing/admin/stats
 * @access Private (Admin)
 */
export const getPricingStats = async (req, res) => {
  try {
    const [total, published, draft, featured] = await Promise.all([
      PricingPackage.countDocuments(),
      PricingPackage.countDocuments({ status: 'Published' }),
      PricingPackage.countDocuments({ status: 'Draft' }),
      PricingPackage.countDocuments({ isFeatured: true }),
    ]);

    // Distinct categories for filter dropdowns
    const categories = await PricingPackage.distinct('category');

    return res.status(200).json({
      success: true,
      stats: {
        totalPackages: total,
        publishedPackages: published,
        draftPackages: draft,
        featuredPackages: featured,
      },
      categories: categories.filter(Boolean),
    });
  } catch (error) {
    console.error('[Pricing Controller] getPricingStats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch pricing statistics: ' + error.message,
    });
  }
};

/**
 * @desc Get single pricing package by ID
 * @route GET /api/pricing/:id
 * @access Private (Admin)
 */
export const getPricingPackageById = async (req, res) => {
  try {
    const { id } = req.params;
    const pkg = await PricingPackage.findById(id);

    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: 'Pricing package not found.',
      });
    }

    return res.status(200).json({
      success: true,
      package: pkg,
    });
  } catch (error) {
    console.error('[Pricing Controller] getPricingPackageById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch pricing package: ' + error.message,
    });
  }
};

/**
 * @desc Create new pricing package
 * @route POST /api/pricing
 * @access Private (Admin)
 */
export const createPricingPackage = async (req, res) => {
  try {
    const {
      packageName,
      tagline,
      description,
      price,
      duration,
      durationType,
      buttonText,
      listingType,
      badge,
      customBadgeText,
      accentColor,
      isFeatured,
      isHighlighted,
      isActive,
      category,
      customCategory,
      targetAudience,
      features,
      additionalNotes,
      termsAndConditions,
      offerExpiryDate,
      ctaType,
      ctaLink,
      status,
      displayOrder,
    } = req.body;

    if (!packageName || !packageName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Package Name is required.',
      });
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid non-negative price is required.',
      });
    }

    // Auto calculate display order if not specified
    let finalOrder = parseInt(displayOrder, 10);
    if (isNaN(finalOrder)) {
      const highestOrder = await PricingPackage.findOne()
        .sort({ displayOrder: -1 })
        .select('displayOrder')
        .lean();
      finalOrder = highestOrder ? (highestOrder.displayOrder || 0) + 1 : 1;
    }

    // Clean features list
    const cleanedFeatures = Array.isArray(features)
      ? features
          .filter((f) => f && f.name && f.name.trim())
          .map((f, idx) => ({
            name: f.name.trim(),
            description: f.description ? f.description.trim() : '',
            isIncluded: f.isIncluded !== false,
            displayOrder: typeof f.displayOrder === 'number' ? f.displayOrder : idx + 1,
          }))
      : [];

    const newPackage = new PricingPackage({
      packageName: packageName.trim(),
      tagline: tagline ? tagline.trim() : '',
      description: description ? description.trim() : '',
      price: parsedPrice,
      duration: parseInt(duration, 10) || 1,
      durationType: durationType || 'Years',
      buttonText: buttonText ? buttonText.trim() : 'Get Started',
      listingType: listingType || 'Standard',
      badge: badge || 'None',
      customBadgeText: customBadgeText ? customBadgeText.trim() : '',
      accentColor: accentColor || '#2563EB',
      isFeatured: !!isFeatured,
      isHighlighted: !!isHighlighted,
      isActive: isActive !== false,
      category:
        category === 'Other' && customCategory && customCategory.trim()
          ? customCategory.trim()
          : (customCategory && customCategory.trim() ? customCategory.trim() : (category && category.trim() ? category.trim() : 'Website Development Packages')),
      customCategory: customCategory ? customCategory.trim() : '',
      targetAudience: targetAudience ? targetAudience.trim() : '',
      features: cleanedFeatures,
      additionalNotes: additionalNotes ? additionalNotes.trim() : '',
      termsAndConditions: termsAndConditions ? termsAndConditions.trim() : '',
      offerExpiryDate:
        offerExpiryDate && !isNaN(new Date(offerExpiryDate).getTime())
          ? new Date(offerExpiryDate)
          : null,
      ctaType: ctaType || 'enquiry',
      ctaLink: ctaLink ? ctaLink.trim() : '',
      status: status === 'Draft' ? 'Draft' : 'Published',
      displayOrder: finalOrder,
      publishedAt: status === 'Draft' ? null : new Date(),
    });

    await newPackage.save();

    return res.status(201).json({
      success: true,
      message: 'Pricing package created successfully.',
      package: newPackage,
    });
  } catch (error) {
    console.error('[Pricing Controller] createPricingPackage error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create pricing package: ' + error.message,
    });
  }
};

/**
 * @desc Update existing pricing package
 * @route PUT /api/pricing/:id
 * @access Private (Admin)
 */
export const updatePricingPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const pkg = await PricingPackage.findById(id);

    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: 'Pricing package not found.',
      });
    }

    const {
      packageName,
      tagline,
      description,
      price,
      duration,
      durationType,
      buttonText,
      listingType,
      badge,
      customBadgeText,
      accentColor,
      isFeatured,
      isHighlighted,
      isActive,
      category,
      customCategory,
      targetAudience,
      features,
      additionalNotes,
      termsAndConditions,
      offerExpiryDate,
      ctaType,
      ctaLink,
      status,
      displayOrder,
    } = req.body;

    if (packageName !== undefined) {
      if (!packageName.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Package Name cannot be empty.',
        });
      }
      pkg.packageName = packageName.trim();
    }

    if (price !== undefined) {
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid non-negative price is required.',
        });
      }
      pkg.price = parsedPrice;
    }

    if (tagline !== undefined) pkg.tagline = tagline.trim();
    if (description !== undefined) pkg.description = description.trim();
    if (duration !== undefined) pkg.duration = parseInt(duration, 10) || 1;
    if (durationType !== undefined) pkg.durationType = durationType;
    if (buttonText !== undefined) pkg.buttonText = buttonText.trim() || 'Get Started';
    if (listingType !== undefined) pkg.listingType = listingType;
    if (badge !== undefined) pkg.badge = badge;
    if (customBadgeText !== undefined) pkg.customBadgeText = customBadgeText.trim();
    if (accentColor !== undefined) pkg.accentColor = accentColor;
    if (isFeatured !== undefined) pkg.isFeatured = !!isFeatured;
    if (isHighlighted !== undefined) pkg.isHighlighted = !!isHighlighted;
    if (isActive !== undefined) pkg.isActive = !!isActive;
    if (category !== undefined || customCategory !== undefined) {
      if (category === 'Other' && customCategory && customCategory.trim()) {
        pkg.category = customCategory.trim();
      } else if (customCategory && customCategory.trim()) {
        pkg.category = customCategory.trim();
      } else if (category !== undefined) {
        pkg.category = category.trim() || 'Website Development Packages';
      }
      if (customCategory !== undefined) pkg.customCategory = customCategory.trim();
    }
    if (targetAudience !== undefined) pkg.targetAudience = targetAudience.trim();

    if (features !== undefined && Array.isArray(features)) {
      pkg.features = features
        .filter((f) => f && f.name && f.name.trim())
        .map((f, idx) => ({
          name: f.name.trim(),
          description: f.description ? f.description.trim() : '',
          isIncluded: f.isIncluded !== false,
          displayOrder: typeof f.displayOrder === 'number' ? f.displayOrder : idx + 1,
        }));
    }

    if (additionalNotes !== undefined) pkg.additionalNotes = additionalNotes.trim();
    if (termsAndConditions !== undefined) pkg.termsAndConditions = termsAndConditions.trim();
    if (offerExpiryDate !== undefined) {
      pkg.offerExpiryDate =
        offerExpiryDate && !isNaN(new Date(offerExpiryDate).getTime())
          ? new Date(offerExpiryDate)
          : null;
    }
    if (ctaType !== undefined) pkg.ctaType = ctaType;
    if (ctaLink !== undefined) pkg.ctaLink = ctaLink.trim();

    if (displayOrder !== undefined) {
      const parsedOrder = parseInt(displayOrder, 10);
      if (!isNaN(parsedOrder)) pkg.displayOrder = parsedOrder;
    }

    if (status !== undefined) {
      const prevStatus = pkg.status;
      pkg.status = status === 'Draft' ? 'Draft' : 'Published';
      if (prevStatus === 'Draft' && pkg.status === 'Published' && !pkg.publishedAt) {
        pkg.publishedAt = new Date();
      }
    }

    await pkg.save();

    return res.status(200).json({
      success: true,
      message: 'Pricing package updated successfully.',
      package: pkg,
    });
  } catch (error) {
    console.error('[Pricing Controller] updatePricingPackage error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update pricing package: ' + error.message,
    });
  }
};

/**
 * @desc Delete pricing package
 * @route DELETE /api/pricing/:id
 * @access Private (Admin)
 */
export const deletePricingPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const pkg = await PricingPackage.findByIdAndDelete(id);

    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: 'Pricing package not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Pricing package "${pkg.packageName}" deleted successfully.`,
    });
  } catch (error) {
    console.error('[Pricing Controller] deletePricingPackage error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete pricing package: ' + error.message,
    });
  }
};

/**
 * @desc Toggle package publication status (Draft <-> Published)
 * @route PATCH /api/pricing/:id/status
 * @access Private (Admin)
 */
export const togglePricingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const pkg = await PricingPackage.findById(id);
    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: 'Pricing package not found.',
      });
    }

    if (status) {
      pkg.status = status === 'Draft' ? 'Draft' : 'Published';
    } else {
      pkg.status = pkg.status === 'Published' ? 'Draft' : 'Published';
    }

    if (pkg.status === 'Published' && !pkg.publishedAt) {
      pkg.publishedAt = new Date();
    }

    await pkg.save();

    return res.status(200).json({
      success: true,
      message: `Package status set to ${pkg.status}.`,
      status: pkg.status,
      package: pkg,
    });
  } catch (error) {
    console.error('[Pricing Controller] togglePricingStatus error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update status: ' + error.message,
    });
  }
};

/**
 * @desc Toggle Featured flag
 * @route PATCH /api/pricing/:id/featured
 * @access Private (Admin)
 */
export const togglePricingFeatured = async (req, res) => {
  try {
    const { id } = req.params;
    const { isFeatured } = req.body;

    const pkg = await PricingPackage.findById(id);
    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: 'Pricing package not found.',
      });
    }

    pkg.isFeatured = typeof isFeatured === 'boolean' ? isFeatured : !pkg.isFeatured;
    await pkg.save();

    return res.status(200).json({
      success: true,
      message: `Package is now ${pkg.isFeatured ? 'featured' : 'standard'}.`,
      isFeatured: pkg.isFeatured,
      package: pkg,
    });
  } catch (error) {
    console.error('[Pricing Controller] togglePricingFeatured error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to toggle featured status: ' + error.message,
    });
  }
};

/**
 * @desc Update display order
 * @route PATCH /api/pricing/:id/order
 * @access Private (Admin)
 */
export const updatePricingOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { displayOrder, direction } = req.body;

    const pkg = await PricingPackage.findById(id);
    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: 'Pricing package not found.',
      });
    }

    if (typeof displayOrder === 'number') {
      pkg.displayOrder = displayOrder;
    } else if (direction === 'up') {
      pkg.displayOrder = Math.max(0, (pkg.displayOrder || 0) - 1);
    } else if (direction === 'down') {
      pkg.displayOrder = (pkg.displayOrder || 0) + 1;
    }

    await pkg.save();

    return res.status(200).json({
      success: true,
      message: 'Display order updated.',
      displayOrder: pkg.displayOrder,
      package: pkg,
    });
  } catch (error) {
    console.error('[Pricing Controller] updatePricingOrder error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update order: ' + error.message,
    });
  }
};

/**
 * @desc Duplicate an existing package
 * @route POST /api/pricing/:id/duplicate
 * @access Private (Admin)
 */
export const duplicatePricingPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const original = await PricingPackage.findById(id).lean();

    if (!original) {
      return res.status(404).json({
        success: false,
        message: 'Original pricing package not found.',
      });
    }

    delete original._id;
    delete original.createdAt;
    delete original.updatedAt;

    original.packageName = `${original.packageName} (Copy)`;
    original.status = 'Draft';
    original.displayOrder = (original.displayOrder || 0) + 1;
    original.publishedAt = null;

    // Reset feature _ids
    if (Array.isArray(original.features)) {
      original.features = original.features.map((f) => {
        const { _id, ...rest } = f;
        return rest;
      });
    }

    const duplicated = new PricingPackage(original);
    await duplicated.save();

    return res.status(201).json({
      success: true,
      message: 'Pricing package duplicated as Draft.',
      package: duplicated,
    });
  } catch (error) {
    console.error('[Pricing Controller] duplicatePricingPackage error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to duplicate package: ' + error.message,
    });
  }
};

/**
 * @desc Get Published and Active Pricing Packages for Public Website
 * @route GET /api/pricing/public
 * @access Public
 */
export const getPublicPricingPackages = async (req, res) => {
  try {
    const { category } = req.query;

    const query = {
      status: 'Published',
      isActive: true,
    };

    if (category && category !== 'All') {
      query.category = category;
    }

    const packages = await PricingPackage.find(query)
      .sort({ displayOrder: 1, createdAt: 1 })
      .lean();

    // Group packages by category
    const groupedByCategory = {};
    packages.forEach((pkg) => {
      const cat = pkg.category || 'Website Development Packages';
      if (!groupedByCategory[cat]) {
        groupedByCategory[cat] = [];
      }
      groupedByCategory[cat].push(pkg);
    });

    return res.status(200).json({
      success: true,
      count: packages.length,
      packages,
      groupedByCategory,
    });
  } catch (error) {
    console.error('[Pricing Controller] getPublicPricingPackages error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load public pricing packages: ' + error.message,
    });
  }
};

/**
 * @desc Get Single Published Pricing Package
 * @route GET /api/pricing/public/:id
 * @access Public
 */
export const getPublicPricingPackageById = async (req, res) => {
  try {
    const { id } = req.params;
    const pkg = await PricingPackage.findOne({
      _id: id,
      status: 'Published',
      isActive: true,
    }).lean();

    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: 'Pricing package not found or inactive.',
      });
    }

    return res.status(200).json({
      success: true,
      package: pkg,
    });
  } catch (error) {
    console.error('[Pricing Controller] getPublicPricingPackageById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load pricing package: ' + error.message,
    });
  }
};

