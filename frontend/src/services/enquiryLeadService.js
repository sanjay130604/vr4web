import api from './api';

export const enquiryLeadService = {
  /**
   * @desc Submit public project enquiry form
   * @param {Object} data - { name, email, phone, countryCode, company, projectType, projectBudget, aboutProject, message }
   */
  async submitEnquiry(data) {
    const res = await api.post('/enquiry-leads', data);
    return res.data;
  },

  /**
   * @desc Get all enquiry leads (Admin)
   * @param {Object} params - { search, status, projectType, projectBudget, startDate, endDate, page, limit, sortBy, sortOrder }
   */
  async getLeads(params = {}) {
    const res = await api.get('/enquiry-leads', { params });
    return res.data;
  },

  /**
   * @desc Get single enquiry lead by ID (Admin)
   */
  async getLeadById(id) {
    const res = await api.get(`/enquiry-leads/${id}`);
    return res.data;
  },

  /**
   * @desc Update enquiry lead status (Admin)
   */
  async updateStatus(id, status) {
    const res = await api.patch(`/enquiry-leads/${id}/status`, { status });
    return res.data;
  },

  /**
   * @desc Send reply email to enquiry lead (Admin)
   * @param {string} id
   * @param {Object} data - { subject, message }
   */
  async sendReply(id, data) {
    const res = await api.post(`/enquiry-leads/${id}/reply`, data);
    return res.data;
  },

  /**
   * @desc Delete enquiry lead (Admin)
   */
  async deleteLead(id) {
    const res = await api.delete(`/enquiry-leads/${id}`);
    return res.data;
  },
};

export default enquiryLeadService;

