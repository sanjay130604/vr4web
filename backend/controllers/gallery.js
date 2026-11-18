import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Gallery from '../models/Gallery.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to safely clean up an uploaded file from disk if no other record uses it
const deleteUploadedFile = async (imageUrl, excludeId = null) => {
  if (!imageUrl || typeof imageUrl !== 'string') return;
  if (!imageUrl.startsWith('/uploads/')) return;

  try {
    // Check if any other gallery document uses this exact image
    const query = {
      $or: [{ imageUrl }, { 'image.url': imageUrl }],
    };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const otherUsage = await Gallery.findOne(query);
    if (otherUsage) return; // Shared image, do not delete

    const filename = path.basename(imageUrl);
    const filePath = path.join(__dirname, '../uploads', filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.warn('[Gallery Controller] Error deleting file:', err.message);
  }
};

// Helper to normalize image payload
const normalizeImageField = (body, existing = null) => {
  let imgUrl =
    body.image?.url ||
    (typeof body.image === 'string' ? body.image : null) ||
    body.imageUrl ||
    existing?.image?.url ||
    existing?.imageUrl ||
    '';

  const alt = body.image?.alt || body.title || existing?.image?.alt || '';
  const width = body.image?.width || existing?.image?.width || null;
  const height = body.image?.height || existing?.image?.height || null;

  body.imageUrl = imgUrl;
  body.image = {
    url: imgUrl,
    alt,
    width,
    height,
  };
};

/**
 * @desc Get all published, non-deleted gallery images (Public)
 * @route GET /api/gallery/public or GET /api/gallery
 */
export const getGalleryImages = async (req, res) => {
  try {
    const { search, category, page, limit } = req.query;

    const query = {
      isDeleted: { $ne: true },
      $or: [{ status: 'published' }, { status: 'visible' }, { status: 'active' }],
    };

    if (search && search.trim()) {
      const s = search.trim();
      query.$and = [
        {
          $or: [
            { title: { $regex: s, $options: 'i' } },
            { description: { $regex: s, $options: 'i' } },
            { caption: { $regex: s, $options: 'i' } },
          ],
        },
      ];
    }

    if (category && category !== 'all' && category !== 'All') {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    const total = await Gallery.countDocuments(query);

    let queryBuilder = Gallery.find(query).sort({
      displayOrder: 1,
      order: 1,
      publishedAt: -1,
      createdAt: -1,
    });

    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      const skip = (pageNum - 1) * limitNum;
      queryBuilder = queryBuilder.skip(skip).limit(limitNum);

      const images = await queryBuilder;
      const totalPages = Math.ceil(total / limitNum) || 1;
      return res.status(200).json({
        success: true,
        count: images.length,
        total,
        totalRecords: total,
        page: pageNum,
        currentPage: pageNum,
        pages: totalPages,
        totalPages,
        pagination: {
          currentPage: pageNum,
          page: pageNum,
          limit: limitNum,
          pageSize: limitNum,
          totalRecords: total,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPreviousPage: pageNum > 1,
        },
        data: images,
      });
    }

    const images = await queryBuilder;
    res.status(200).json({
      success: true,
      count: images.length,
      total,
      data: images,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get all featured gallery images for the Homepage (Public)
 * @route GET /api/gallery/featured
 */
export const getFeaturedGalleryImages = async (req, res) => {
  try {
    const query = {
      isDeleted: { $ne: true },
      isFeatured: true,
      $or: [{ status: 'published' }, { status: 'visible' }, { status: 'active' }],
    };

    const images = await Gallery.find(query).sort({
      displayOrder: 1,
      order: 1,
      publishedAt: -1,
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: images.length,
      data: images,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get all gallery images including drafts & trash (Admin)
 * @route GET /api/gallery/admin or GET /api/gallery/admin/all
 */
export const getAdminGalleryImages = async (req, res) => {
  try {
    const { search, category, status, deleted, featured, page = 1, limit = 50 } = req.query;
    const query = {};

    // Filter by deletion status (active by default, deleted/trash, or all)
    if (deleted === 'deleted' || deleted === 'trash' || deleted === 'true') {
      query.isDeleted = true;
    } else if (deleted === 'all') {
      // Include both active and deleted
    } else {
      query.isDeleted = { $ne: true };
    }

    // Filter by publication status
    if (status && status !== 'all') {
      if (status === 'published' || status === 'active') {
        query.$or = [{ status: 'published' }, { status: 'visible' }, { status: 'active' }];
      } else if (status === 'draft' || status === 'inactive') {
        query.$or = [{ status: 'draft' }, { status: 'hidden' }, { status: 'inactive' }];
      } else {
        query.status = status;
      }
    }

    // Filter by homepage featured
    if (featured === 'true') {
      query.isFeatured = true;
    } else if (featured === 'false') {
      query.isFeatured = false;
    }

    if (category && category !== 'all') {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$and = [
        {
          $or: [
            { title: { $regex: s, $options: 'i' } },
            { description: { $regex: s, $options: 'i' } },
            { caption: { $regex: s, $options: 'i' } },
          ],
        },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [total, images, activeCount, deletedCount, publishedCount, draftCount, featuredCount] =
      await Promise.all([
        Gallery.countDocuments(query),
        Gallery.find(query)
          .sort({ displayOrder: 1, order: 1, publishedAt: -1, createdAt: -1, _id: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Gallery.countDocuments({ isDeleted: { $ne: true } }),
        Gallery.countDocuments({ isDeleted: true }),
        Gallery.countDocuments({
          isDeleted: { $ne: true },
          $or: [{ status: 'published' }, { status: 'visible' }, { status: 'active' }],
        }),
        Gallery.countDocuments({
          isDeleted: { $ne: true },
          $or: [{ status: 'draft' }, { status: 'hidden' }, { status: 'inactive' }],
        }),
        Gallery.countDocuments({
          isDeleted: { $ne: true },
          isFeatured: true,
        }),
      ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      success: true,
      count: images.length,
      data: images,
      images,
      total,
      totalRecords: total,
      counts: {
        active: activeCount,
        published: publishedCount,
        draft: draftCount,
        featured: featuredCount,
        deleted: deletedCount,
        total: activeCount + deletedCount,
      },
      page: pageNum,
      currentPage: pageNum,
      totalPages,
      pages: totalPages,
      pagination: {
        total,
        totalRecords: total,
        page: pageNum,
        currentPage: pageNum,
        pages: totalPages,
        totalPages,
        limit: limitNum,
        pageSize: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get single gallery image
 * @route GET /api/gallery/:id
 */
export const getGalleryById = async (req, res) => {
  try {
    const image = await Gallery.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Gallery image not found' });
    }

    // Public cannot view deleted or draft images unless requested by admin
    const isAdmin = Boolean(req.admin);
    if (!isAdmin && (image.isDeleted || image.status === 'draft' || image.status === 'inactive')) {
      return res.status(404).json({ success: false, message: 'Gallery image not available' });
    }

    res.status(200).json({ success: true, data: image });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Create new gallery image (Admin)
 * @route POST /api/gallery
 */
export const createGalleryImage = async (req, res) => {
  try {
    const body = { ...req.body };

    if (!body.title || !body.title.trim()) {
      return res.status(400).json({ success: false, message: 'Image title is required' });
    }

    // Description is OPTIONAL
    const description = (body.description || body.caption || '').trim();
    body.description = description;
    body.caption = description;

    // Category / Other Custom Category Handling
    if (body.category === 'Other') {
      if (body.customCategory && body.customCategory.trim()) {
        body.category = body.customCategory.trim();
        body.customCategory = body.customCategory.trim();
      }
    } else if (body.customCategory && body.customCategory.trim()) {
      body.category = body.customCategory.trim();
    }
    body.category = body.category && body.category.trim() ? body.category.trim() : 'General';

    normalizeImageField(body);

    if (!body.image.url) {
      return res.status(400).json({ success: false, message: 'Gallery image file or URL is required' });
    }

    // Status & Publishing
    const isPub =
      body.status === 'published' || body.status === 'active' || body.status === 'visible';
    body.status = isPub ? 'published' : 'draft';
    if (isPub && !body.publishedAt) {
      body.publishedAt = new Date();
    }

    // Featured & Display Order
    body.isFeatured = Boolean(body.isFeatured);
    body.displayOrder = Number(body.displayOrder ?? body.order ?? 0);
    body.order = body.displayOrder;

    body.isDeleted = false;
    body.deletedAt = null;

    const image = await Gallery.create(body);

    res.status(201).json({
      success: true,
      message: isPub ? 'Gallery image published successfully' : 'Gallery image saved as draft',
      data: image,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Update existing gallery image (Admin)
 * @route PUT /api/gallery/:id
 */
export const updateGalleryImage = async (req, res) => {
  try {
    const existing = await Gallery.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Gallery image not found' });
    }

    const body = { ...req.body };

    if (body.title !== undefined) {
      if (!body.title.trim()) {
        return res.status(400).json({ success: false, message: 'Image title cannot be empty' });
      }
      body.title = body.title.trim();
    }

    if (body.description !== undefined || body.caption !== undefined) {
      const desc = (body.description || body.caption || '').trim();
      body.description = desc;
      body.caption = desc;
    }

    // Check if image URL changed and clean up old file if safe
    const newImgUrl =
      body.image?.url ||
      (typeof body.image === 'string' ? body.image : null) ||
      body.imageUrl;
    const oldImgUrl = existing.image?.url || existing.imageUrl;
    if (newImgUrl && oldImgUrl && newImgUrl !== oldImgUrl) {
      await deleteUploadedFile(oldImgUrl, existing._id);
    }

    // Preserve existing image if no new image provided
    normalizeImageField(body, existing);

    // Featured toggle
    if (body.isFeatured !== undefined) {
      body.isFeatured = Boolean(body.isFeatured);
    }

    // Display order
    if (body.displayOrder !== undefined || body.order !== undefined) {
      body.displayOrder = Number(body.displayOrder ?? body.order ?? 0);
      body.order = body.displayOrder;
    }

    // Category handling
    if (body.category !== undefined) {
      if (body.category === 'Other') {
        if (body.customCategory && body.customCategory.trim()) {
          body.category = body.customCategory.trim();
          body.customCategory = body.customCategory.trim();
        }
      } else if (body.customCategory && body.customCategory.trim()) {
        body.category = body.customCategory.trim();
      }
      body.category = body.category && body.category.trim() ? body.category.trim() : 'General';
    }

    // Publication status
    if (body.status !== undefined) {
      const isPub =
        body.status === 'published' || body.status === 'active' || body.status === 'visible';
      body.status = isPub ? 'published' : 'draft';
      if (isPub && !existing.publishedAt && !body.publishedAt) {
        body.publishedAt = new Date();
      }
    }

    const updated = await Gallery.findByIdAndUpdate(req.params.id, body, {
      returnDocument: 'after',
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Gallery image updated successfully',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Toggle homepage featured status (Admin)
 * @route PATCH /api/gallery/:id/featured
 */
export const toggleFeaturedGalleryImage = async (req, res) => {
  try {
    const image = await Gallery.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Gallery image not found' });
    }

    const newFeatured =
      req.body.isFeatured !== undefined ? Boolean(req.body.isFeatured) : !image.isFeatured;

    image.isFeatured = newFeatured;
    await image.save();

    res.status(200).json({
      success: true,
      message: newFeatured
        ? 'Image added to Homepage Featured Gallery'
        : 'Image removed from Homepage Featured Gallery',
      data: image,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Soft delete gallery image (Admin)
 * @route DELETE /api/gallery/:id
 */
export const deleteGalleryImage = async (req, res) => {
  try {
    const image = await Gallery.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Gallery image not found' });
    }

    image.isDeleted = true;
    image.deletedAt = new Date();
    await image.save();

    res.status(200).json({
      success: true,
      message: 'Gallery image moved to trash. Undo',
      data: image,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Restore soft-deleted gallery image (Admin)
 * @route PATCH /api/gallery/:id/restore
 */
export const restoreGalleryImage = async (req, res) => {
  try {
    const image = await Gallery.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Gallery image not found' });
    }

    image.isDeleted = false;
    image.deletedAt = null;
    await image.save();

    res.status(200).json({
      success: true,
      message: 'Gallery image restored successfully',
      data: image,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Update gallery image publication status (Admin)
 * @route PATCH /api/gallery/:id/status
 */
export const updateGalleryImageStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const isPub = status === 'published' || status === 'active';
    const isDraft = status === 'draft' || status === 'inactive';

    if (!isPub && !isDraft) {
      return res.status(400).json({
        success: false,
        message: 'Valid status (active/published or inactive/draft) is required',
      });
    }

    const image = await Gallery.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Gallery image not found' });
    }

    image.status = isPub ? 'published' : 'draft';
    if (isPub && !image.publishedAt) {
      image.publishedAt = new Date();
    }
    await image.save();

    res.status(200).json({
      success: true,
      message: `Gallery image status changed to ${image.status}`,
      data: image,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Permanently delete gallery image from trash (Admin Trash Action)
 * @route DELETE /api/gallery/:id/permanent
 */
export const hardDeleteGalleryImage = async (req, res) => {
  try {
    const image = await Gallery.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Gallery image not found' });
    }

    const imgUrl = image.image?.url || image.imageUrl;
    await Gallery.findByIdAndDelete(req.params.id);

    // Clean up file asset if not shared
    if (imgUrl) {
      await deleteUploadedFile(imgUrl, req.params.id);
    }

    res.status(200).json({
      success: true,
      message: 'Gallery image permanently deleted',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
