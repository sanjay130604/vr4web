import api from './api';

export const galleryService = {
  /**
   * @desc Get all published, non-deleted gallery images (Public)
   * @param {Object} params - { search, category, page, limit }
   */
  async getGalleryImages(params = {}) {
    const res = await api.get('/gallery/public', { params });
    return res.data;
  },

  /**
   * @desc Alias for getGalleryImages
   */
  async getPublicGalleryImages(params = {}) {
    return this.getGalleryImages(params);
  },

  /**
   * @desc Get featured gallery images for Homepage (Public)
   */
  async getFeaturedGalleryImages() {
    const res = await api.get('/gallery/featured');
    return res.data;
  },

  /**
   * @desc Get single published gallery image by ID (Public)
   */
  async getGalleryImageById(id) {
    const res = await api.get(`/gallery/${id}`);
    return res.data;
  },

  /**
   * @desc Get all gallery images including drafts & soft-deleted items (Admin)
   * @param {Object} params - { search, status, deleted, featured, category, page, limit }
   */
  async getAdminGalleryImages(params = {}) {
    const res = await api.get('/gallery/admin', { params });
    return res.data;
  },

  /**
   * @desc Get single gallery image for admin edit / view
   */
  async getAdminGalleryImageById(id) {
    const res = await api.get(`/gallery/${id}`);
    return res.data;
  },

  /**
   * @desc Create a new gallery image entry (Admin)
   */
  async createGalleryImage(data) {
    const res = await api.post('/gallery', data);
    return res.data;
  },

  /**
   * @desc Update an existing gallery image entry (Admin)
   */
  async updateGalleryImage(id, data) {
    const res = await api.put(`/gallery/${id}`, data);
    return res.data;
  },

  /**
   * @desc Toggle homepage featured status (Admin)
   */
  async toggleFeatured(id, isFeatured) {
    const res = await api.patch(`/gallery/${id}/featured`, { isFeatured });
    return res.data;
  },

  /**
   * @desc Soft delete a gallery image entry (Admin)
   */
  async deleteGalleryImage(id) {
    const res = await api.delete(`/gallery/${id}`);
    return res.data;
  },

  /**
   * @desc Soft delete alias for Admin component compatibility
   */
  async softDeleteGalleryImage(id) {
    return this.deleteGalleryImage(id);
  },

  /**
   * @desc Restore a soft-deleted gallery image (Admin)
   */
  async restoreGalleryImage(id) {
    const res = await api.patch(`/gallery/${id}/restore`);
    return res.data;
  },

  /**
   * @desc Update publication status (draft / published / active / inactive)
   */
  async updateGalleryImageStatus(id, status) {
    const res = await api.patch(`/gallery/${id}/status`, { status });
    return res.data;
  },

  /**
   * @desc Permanently delete gallery image from trash (Admin)
   */
  async hardDeleteGalleryImage(id) {
    const res = await api.delete(`/gallery/${id}/permanent`);
    return res.data;
  },

  /**
   * @desc Upload gallery image file via Multer with progress tracking
   * @param {File} file
   * @param {Function} onProgress - (percent) => void
   */
  async uploadGalleryImage(file, onProgress) {
    const formData = new FormData();
    formData.append('image', file);

    const res = await api.post('/gallery/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return res.data;
  },
};

export default galleryService;
