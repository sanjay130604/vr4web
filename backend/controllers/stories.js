import Story from '../models/Story.js';

export const getStories = async (req, res) => {
  try {
    const { search, status, category, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { title: { $regex: s, $options: 'i' } },
        { summary: { $regex: s, $options: 'i' } },
        { author: { $regex: s, $options: 'i' } },
        { category: { $regex: s, $options: 'i' } },
      ];
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    if (category && category !== 'all') {
      query.category = category;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [total, stories, totalAll, publishedCount, draftCount, archivedCount] = await Promise.all([
      Story.countDocuments(query),
      Story.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Story.countDocuments({}),
      Story.countDocuments({ status: 'published' }),
      Story.countDocuments({ status: 'draft' }),
      Story.countDocuments({ status: 'archived' }),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      success: true,
      count: stories.length,
      data: stories,
      stories,
      total,
      totalRecords: total,
      page: pageNum,
      currentPage: pageNum,
      totalPages,
      pages: totalPages,
      counts: {
        total: totalAll,
        published: publishedCount,
        draft: draftCount,
        archived: archivedCount,
      },
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

export const getStoryById = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }
    res.status(200).json({ success: true, data: story });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createStory = async (req, res) => {
  try {
    const { title, summary, content, category, author, imageUrl, status, featured } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    const story = await Story.create({
      title,
      summary,
      content,
      category: category || 'Digital Transformation',
      author: author || req.admin?.name || 'VR4Web Editorial',
      imageUrl: imageUrl || '/banner/3.jpg',
      status: status || 'published',
      featured: Boolean(featured),
    });
    res.status(201).json({ success: true, message: 'Story created successfully', data: story });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStory = async (req, res) => {
  try {
    const story = await Story.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
      runValidators: true,
    });
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }
    res.status(200).json({ success: true, message: 'Story updated successfully', data: story });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteStory = async (req, res) => {
  try {
    const story = await Story.findByIdAndDelete(req.params.id);
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }
    res.status(200).json({ success: true, message: 'Story deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

