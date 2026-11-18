import api from './api';

export const pricingService = {
  // ─── Public APIs ───
  async getPublicPricing(params = {}) {
    const res = await api.get('/pricing/public', { params });
    return res.data;
  },

  async getPublicPricingById(id) {
    const res = await api.get(`/pricing/public/${id}`);
    return res.data;
  },

  // ─── Admin Dashboard APIs ───
  async getAdminPricing(params = {}) {
    const res = await api.get('/pricing', { params });
    return res.data;
  },

  async getPricingStats() {
    const res = await api.get('/pricing/admin/stats');
    return res.data;
  },

  async getPricingById(id) {
    const res = await api.get(`/pricing/${id}`);
    return res.data;
  },

  async createPricing(data) {
    const res = await api.post('/pricing', data);
    return res.data;
  },

  async updatePricing(id, data) {
    const res = await api.put(`/pricing/${id}`, data);
    return res.data;
  },

  async deletePricing(id) {
    const res = await api.delete(`/pricing/${id}`);
    return res.data;
  },

  async toggleStatus(id, status) {
    const res = await api.patch(`/pricing/${id}/status`, { status });
    return res.data;
  },

  async toggleFeatured(id, isFeatured) {
    const res = await api.patch(`/pricing/${id}/featured`, { isFeatured });
    return res.data;
  },

  async updateOrder(id, data) {
    const res = await api.patch(`/pricing/${id}/order`, data);
    return res.data;
  },

  async duplicatePricing(id) {
    const res = await api.post(`/pricing/${id}/duplicate`);
    return res.data;
  },
};

export default pricingService;

