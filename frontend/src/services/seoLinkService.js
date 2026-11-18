import api from './api';

export const seoLinkService = {
  // ─── Public Dynamic Links ───
  async getPublicPageLinks(pageSlug) {
    const res = await api.get(`/seo-links/public/${encodeURIComponent(pageSlug)}`);
    return res.data;
  },

  // ─── Admin Page Management ───
  async getPages(params = {}) {
    const res = await api.get('/seo-links/pages', { params });
    return res.data;
  },

  async getPageById(id) {
    const res = await api.get(`/seo-links/pages/${id}`);
    return res.data;
  },

  async updatePageTargets(id, data) {
    const res = await api.put(`/seo-links/pages/${id}`, data);
    return res.data;
  },

  async syncPages() {
    const res = await api.post('/seo-links/pages/sync');
    return res.data;
  },

  // ─── Admin Analytics ───
  async getAnalytics() {
    const res = await api.get('/seo-links/analytics');
    return res.data;
  },

  // ─── Admin Links CRUD ───
  async getLinks(params = {}) {
    const res = await api.get('/seo-links', { params });
    return res.data;
  },

  async createLink(data) {
    const res = await api.post('/seo-links', data);
    return res.data;
  },

  async updateLink(id, data) {
    const res = await api.put(`/seo-links/${id}`, data);
    return res.data;
  },

  async deleteLink(id) {
    const res = await api.delete(`/seo-links/${id}`);
    return res.data;
  },

  // ─── Validation & Auditing ───
  async validateLink(id) {
    const res = await api.post(`/seo-links/validate/${id}`);
    return res.data;
  },

  async validateAllLinks(pageId = null) {
    const res = await api.post('/seo-links/validate-all', { pageId });
    return res.data;
  },

  async analyzePage(pageId) {
    const res = await api.post(`/seo-links/analyze/${pageId}`);
    return res.data;
  },

  async getBrokenLinks() {
    const res = await api.get('/seo-links/broken');
    return res.data;
  },

  // ─── Export ───
  async exportLinks(format = 'csv') {
    const res = await api.get(`/seo-links/export?format=${format}`, {
      responseType: 'blob',
    });
    return res;
  },
};

export default seoLinkService;

