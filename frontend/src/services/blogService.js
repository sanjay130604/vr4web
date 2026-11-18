import api from './api';

export const blogService = {
  // Public Blogs API
  async getBlogs(params = {}) {
    const res = await api.get('/blogs', { params });
    return res.data;
  },

  async getBlogBySlug(slug) {
    const res = await api.get(`/blogs/${slug}`);
    return res.data;
  },

  async getRelatedBlogs(slug) {
    const res = await api.get(`/blogs/${slug}/related`);
    return res.data;
  },

  // Admin Blogs API
  async getAdminBlogs(params = {}) {
    const res = await api.get('/blogs/admin/all', { params });
    return res.data;
  },

  async getAdminBlogById(id) {
    const res = await api.get(`/blogs/${id}`);
    return res.data;
  },

  async createBlog(data) {
    const res = await api.post('/blogs', data);
    return res.data;
  },

  async updateBlog(id, data) {
    const res = await api.put(`/blogs/${id}`, data);
    return res.data;
  },

  async deleteBlog(id) {
    const res = await api.delete(`/blogs/${id}`);
    return res.data;
  },

  async duplicateBlog(id) {
    const res = await api.post(`/blogs/${id}/duplicate`);
    return res.data;
  },

  async updateBlogStatus(id, status) {
    const res = await api.patch(`/blogs/${id}/status`, { status });
    return res.data;
  },

  async updateBlogFeatured(id, isFeatured) {
    const res = await api.patch(`/blogs/${id}/featured`, { isFeatured });
    return res.data;
  },

  async uploadBlogImage(file, onProgress) {
    const formData = new FormData();
    formData.append('image', file);
    const res = await api.post('/blogs/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
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

export default blogService;

