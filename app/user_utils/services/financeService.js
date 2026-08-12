/**
 * =============================================================================
 * 💰 FINANCE SERVICE — Income, Expense & Financial Summary (React Native)
 * =============================================================================
 */
import apiClient from '../api';

const financeService = {
  getSummary: async (year, extraParams = {}) => {
    const params = { ...(year ? { year: Number(year) } : {}), ...extraParams };
    const { data } = await apiClient.get('/financialSummary/', { params });
    return data;
  },

  getAIReport: async (year) => {
    const { data } = await apiClient.get('/ai/financial-report/', { params: { year } });
    return data;
  },

  getIncomes: async (params) => {
    const { data } = await apiClient.get('/income/', { params });
    return data;
  },

  createIncome: async (payload) => {
    const isFormData = payload instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const { data } = await apiClient.post('/income/', payload, config);
    return data;
  },

  verifyIncome: async (id) => {
    const { data } = await apiClient.post(`/income/${id}/verify/`);
    return data;
  },

  rejectIncome: async (id, reason = '') => {
    const { data } = await apiClient.post(`/income/${id}/reject/`, { reason });
    return data;
  },

  updateIncome: async (id, payload) => {
    const { data } = await apiClient.patch(`/income/${id}/`, payload);
    return data;
  },

  deleteIncome: async (id) => {
    await apiClient.delete(`/income/${id}/`);
  },

  getExpenses: async (params) => {
    const { data } = await apiClient.get('/expense/', { params });
    return data;
  },

  createExpense: async (formData) => {
    const { data } = await apiClient.post('/expense/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  deleteExpense: async (id) => {
    await apiClient.delete(`/expense/${id}/`);
  },

  updateExpense: async (id, payload) => {
    const isFormData = payload instanceof FormData;
    const headers = isFormData ? { 'Content-Type': 'multipart/form-data' } : {};
    const { data } = await apiClient.patch(`/expense/${id}/`, payload, { headers });
    return data;
  },

  getSpecialCharges: async (params) => {
    const { data } = await apiClient.get('/specialcharges/', { params });
    return data;
  },

  getMemberIncomeTable: async (params) => {
    const { data } = await apiClient.get('/income/member_table/', { params });
    return data;
  },
};

export default financeService;
