import api from './api';

export const newspaperService = {
  // Public Newspapers API
  async getNewspapers(params = {}) {
    const res = await api.get('/newspapers', { params });
    return res.data;
  },

  async getNewspaperById(id) {
    const res = await api.get(`/newspapers/${id}`);
    return res.data;
  },

  // Admin Newspapers API
  async getAdminNewspapers(params = {}) {
    const res = await api.get('/admin/newspapers', { params });
    return res.data;
  },

  async getAdminNewspaperById(id) {
    const res = await api.get(`/admin/newspapers/${id}`);
    return res.data;
  },

  async createNewspaper(data) {
    const res = await api.post('/admin/newspapers', data);
    return res.data;
  },

  async updateNewspaper(id, data) {
    const res = await api.put(`/admin/newspapers/${id}`, data);
    return res.data;
  },

  async deleteNewspaper(id) {
    const res = await api.delete(`/admin/newspapers/${id}`);
    return res.data;
  },

  async updateNewspaperStatus(id, status) {
    const res = await api.patch(`/admin/newspapers/${id}/status`, { status });
    return res.data;
  },

  async uploadNewspaperImage(file, onProgress) {
    const formData = new FormData();
    formData.append('image', file);
    const res = await api.post('/admin/newspapers/upload-image', formData, {
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

  async uploadNewspaperPdf(file, onProgress) {
    const formData = new FormData();
    formData.append('pdf', file);
    const res = await api.post('/admin/newspapers/upload-pdf', formData, {
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

export default newspaperService;

