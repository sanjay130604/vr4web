import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Newspaper from '../models/Newspaper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../uploads');

/**
 * @desc Public: Get all published newspapers
 * @route GET /api/newspapers or GET /api/newspaper
 */
export const getPublicNewspapers = async (req, res) => {
  try {
    const { search, page = 1, limit = 12 } = req.query;
    const query = { status: 'published' };

    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { summary: { $regex: q, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [total, newspapers] = await Promise.all([
      Newspaper.countDocuments(query),
      Newspaper.find(query)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      success: true,
      count: newspapers.length,
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
      data: newspapers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Public: Get single published newspaper by ID
 * @route GET /api/newspapers/:id or GET /api/newspaper/:id
 */
export const getPublicNewspaperById = async (req, res) => {
  try {
    const { id } = req.params;
    let newspaper = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      newspaper = await Newspaper.findById(id);
    }

    if (!newspaper || newspaper.status !== 'published') {
      return res.status(404).json({ success: false, message: 'Newspaper publication not found' });
    }

    res.status(200).json({ success: true, data: newspaper });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Admin: Get all newspapers (including drafts)
 * @route GET /api/admin/newspapers
 */
export const getAdminNewspapers = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search && search.trim()) {
      const q = search.trim();
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { summary: { $regex: q, $options: 'i' } },
        { 'pdf.fileName': { $regex: q, $options: 'i' } },
      ];
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [total, newspapers] = await Promise.all([
      Newspaper.countDocuments(query),
      Newspaper.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      success: true,
      count: newspapers.length,
      data: newspapers,
      newspapers,
      total,
      totalRecords: total,
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
 * @desc Admin: Get single newspaper for editing
 * @route GET /api/admin/newspapers/:id
 */
export const getAdminNewspaperById = async (req, res) => {
  try {
    const { id } = req.params;
    let newspaper = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      newspaper = await Newspaper.findById(id);
    }

    if (!newspaper) {
      return res.status(404).json({ success: false, message: 'Newspaper publication not found' });
    }

    res.status(200).json({ success: true, data: newspaper });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Admin: Create new newspaper publication
 * @route POST /api/admin/newspapers or POST /api/newspapers
 */
export const createNewspaper = async (req, res) => {
  try {
    const { title, description, image, imageUrl, pdf, pdfUrl, fileName, fileSize, status, category, customCategory } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Newspaper title is required' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Newspaper description is required' });
    }

    let resolvedCategory = (category || '').trim();
    if (resolvedCategory === 'Other' || !resolvedCategory) {
      if (customCategory && customCategory.trim()) {
        resolvedCategory = customCategory.trim();
      } else {
        resolvedCategory = 'Editorial Publication';
      }
    } else if (customCategory && customCategory.trim()) {
      resolvedCategory = customCategory.trim();
    }

    const resolvedImgUrl = (typeof image === 'object' && image?.url) ? image.url : (imageUrl || image || '/white-paper.png');
    const resolvedImgAlt = (typeof image === 'object' && image?.alt) ? image.alt : title.trim();

    const resolvedPdfUrl = (typeof pdf === 'object' && pdf?.url) ? pdf.url : (pdfUrl || (typeof pdf === 'string' ? pdf : ''));
    const resolvedPdfName = (typeof pdf === 'object' && pdf?.fileName) ? pdf.fileName : (fileName || 'document.pdf');
    const resolvedPdfSize = (typeof pdf === 'object' && pdf?.fileSize) ? pdf.fileSize : (fileSize || 0);

    const safePublishedAt =
      req.body.publishedAt && !isNaN(new Date(req.body.publishedAt).getTime())
        ? new Date(req.body.publishedAt)
        : status === 'published'
        ? new Date()
        : undefined;

    const newspaper = await Newspaper.create({
      title: title.trim(),
      description: description.trim(),
      summary: description.trim(),
      image: {
        url: resolvedImgUrl,
        alt: resolvedImgAlt,
      },
      imageUrl: resolvedImgUrl,
      pdf: {
        url: resolvedPdfUrl,
        fileName: resolvedPdfName,
        fileSize: resolvedPdfSize,
      },
      pdfUrl: resolvedPdfUrl,
      fileName: resolvedPdfName,
      fileSize: resolvedPdfSize,
      category: resolvedCategory,
      customCategory: (customCategory || '').trim(),
      status: status || 'draft',
      publishedAt: safePublishedAt,
    });

    res.status(201).json({
      success: true,
      message: 'Newspaper created successfully',
      data: newspaper,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Admin: Update newspaper publication
 * @route PUT /api/admin/newspapers/:id or PUT /api/newspapers/:id
 */
export const updateNewspaper = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Newspaper.findById(id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Newspaper publication not found' });
    }

    const { title, description, image, imageUrl, pdf, pdfUrl, fileName, fileSize, status, category, customCategory } = req.body;

    if (title !== undefined) existing.title = title.trim();
    if (description !== undefined) {
      existing.description = description.trim();
      existing.summary = description.trim();
    }

    if (category !== undefined || customCategory !== undefined) {
      let resolvedCategory = (category !== undefined ? category : existing.category || '').trim();
      if (resolvedCategory === 'Other' || !resolvedCategory) {
        if (customCategory && customCategory.trim()) {
          resolvedCategory = customCategory.trim();
        } else if (!resolvedCategory) {
          resolvedCategory = 'Editorial Publication';
        }
      } else if (customCategory && customCategory.trim()) {
        resolvedCategory = customCategory.trim();
      }
      existing.category = resolvedCategory;
      if (customCategory !== undefined) {
        existing.customCategory = (customCategory || '').trim();
      }
    }

    // Update image if provided
    if (image !== undefined || imageUrl !== undefined) {
      const newImgUrl = (typeof image === 'object' && image?.url) ? image.url : (imageUrl || image || existing.image?.url);
      const newImgAlt = (typeof image === 'object' && image?.alt) ? image.alt : (existing.image?.alt || existing.title);
      existing.image = { url: newImgUrl, alt: newImgAlt };
      existing.imageUrl = newImgUrl;
    }

    // Update PDF if provided
    if (pdf !== undefined || pdfUrl !== undefined) {
      const newPdfUrl = (typeof pdf === 'object' && pdf?.url) ? pdf.url : (pdfUrl || (typeof pdf === 'string' ? pdf : existing.pdf?.url));
      const newPdfName = (typeof pdf === 'object' && pdf?.fileName) ? pdf.fileName : (fileName || existing.pdf?.fileName || 'document.pdf');
      const newPdfSize = (typeof pdf === 'object' && pdf?.fileSize) ? pdf.fileSize : (fileSize || existing.pdf?.fileSize || 0);
      existing.pdf = { url: newPdfUrl, fileName: newPdfName, fileSize: newPdfSize };
      existing.pdfUrl = newPdfUrl;
      existing.fileName = newPdfName;
      existing.fileSize = newPdfSize;
    }

    if (status !== undefined) {
      existing.status = status;
    if (req.body.publishedAt !== undefined) {
      existing.publishedAt =
        req.body.publishedAt && !isNaN(new Date(req.body.publishedAt).getTime())
          ? new Date(req.body.publishedAt)
          : existing.status === 'published'
          ? (existing.publishedAt || new Date())
          : null;
    } else if (status === 'published' && !existing.publishedAt) {
      existing.publishedAt = new Date();
    }
    }

    await existing.save();

    res.status(200).json({
      success: true,
      message: 'Newspaper updated successfully',
      data: existing,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Admin: Delete newspaper publication
 * @route DELETE /api/admin/newspapers/:id or DELETE /api/newspapers/:id
 */
export const deleteNewspaper = async (req, res) => {
  try {
    const { id } = req.params;
    const newspaper = await Newspaper.findById(id);

    if (!newspaper) {
      return res.status(404).json({ success: false, message: 'Newspaper publication not found' });
    }

    // Cleanup local files if uploaded into /uploads/
    const cleanupFile = (fileRelPath) => {
      if (fileRelPath && fileRelPath.startsWith('/uploads/')) {
        const fullPath = path.join(uploadsDir, path.basename(fileRelPath));
        if (fs.existsSync(fullPath)) {
          try {
            fs.unlinkSync(fullPath);
          } catch (e) {
            console.warn(`[Cleanup] Error deleting file ${fullPath}:`, e.message);
          }
        }
      }
    };

    cleanupFile(newspaper.image?.url);
    cleanupFile(newspaper.imageUrl);
    cleanupFile(newspaper.pdf?.url);
    cleanupFile(newspaper.pdfUrl);

    await Newspaper.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Newspaper publication deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Admin: Toggle newspaper status (draft / published)
 * @route PATCH /api/admin/newspapers/:id/status
 */
export const updateNewspaperStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['draft', 'published'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'draft' or 'published'",
      });
    }

    const newspaper = await Newspaper.findById(id);
    if (!newspaper) {
      return res.status(404).json({ success: false, message: 'Newspaper publication not found' });
    }

    newspaper.status = status;
    if (status === 'published' && !newspaper.publishedAt) {
      newspaper.publishedAt = new Date();
    }
    await newspaper.save();

    res.status(200).json({
      success: true,
      message: `Newspaper marked as ${status}`,
      data: newspaper,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Admin: Upload newspaper image
 * @route POST /api/admin/newspapers/upload-image
 */
export const uploadNewspaperImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({
      success: true,
      message: 'Newspaper image uploaded successfully',
      url: fileUrl,
      fileName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Admin: Upload newspaper PDF
 * @route POST /api/admin/newspapers/upload-pdf
 */
export const uploadNewspaperPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No PDF file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.status(200).json({
      success: true,
      message: 'Newspaper PDF uploaded successfully',
      url: fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
