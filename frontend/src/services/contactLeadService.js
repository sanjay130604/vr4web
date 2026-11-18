import api from './api';

export const contactLeadService = {
  /**
   * @desc Submit public contact form
   * @param {Object} data - { name, email, phone, phoneCode, subject, message }
   */
  async submitContact(data) {
    const res = await api.post('/contact-leads', data);
    return res.data;
  },

  /**
   * @desc Get all contact leads (Admin)
   * @param {Object} params - { search, status, startDate, endDate, page, limit, sortBy, sortOrder }
   */
  async getLeads(params = {}) {
    const res = await api.get('/contact-leads', { params });
    return res.data;
  },

  /**
   * @desc Get single contact lead by ID (Admin)
   */
  async getLeadById(id) {
    const res = await api.get(`/contact-leads/${id}`);
    return res.data;
  },

  /**
   * @desc Update contact lead status (Admin)
   */
  async updateStatus(id, status) {
    const res = await api.patch(`/contact-leads/${id}/status`, { status });
    return res.data;
  },

  /**
   * @desc Send reply email to contact lead (Admin)
   * @param {string} id
   * @param {Object} data - { subject, message }
   */
  async sendReply(id, data) {
    const res = await api.post(`/contact-leads/${id}/reply`, data);
    return res.data;
  },

  /**
   * @desc Delete contact lead (Admin)
   */
  async deleteLead(id) {
    const res = await api.delete(`/contact-leads/${id}`);
    return res.data;
  },
};

export default contactLeadService;

