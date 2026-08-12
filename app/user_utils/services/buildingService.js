/**
 * =============================================================================
 * 🏢 BUILDING SERVICE — Buildings, Flats, Categories, Special Charges (RN)
 * =============================================================================
 */
import apiClient from '../api';

const buildingService = {
  getBuildings: async () => {
    const { data } = await apiClient.get('/building/');
    return data;
  },
  getMyBuilding: async () => {
    const { data } = await apiClient.get('/building/my_building/');
    return data;
  },
  createBuilding: async (payload) => {
    const { data } = await apiClient.post('/building/', payload);
    return data;
  },
  updateBuilding: async (id, payload) => {
    const { data } = await apiClient.patch(`/building/${id}/`, payload);
    return data;
  },
  deleteBuilding: async (id) => {
    await apiClient.delete(`/building/${id}/`);
  },

  getFlats: async (params = {}) => {
    const { data } = await apiClient.get('/flat/', { params });
    return data;
  },
  createFlat: async (payload) => {
    const { data } = await apiClient.post('/flat/', payload);
    return data;
  },
  updateFlat: async (id, payload) => {
    const { data } = await apiClient.patch(`/flat/${id}/`, payload);
    return data;
  },
  deleteFlat: async (id) => {
    await apiClient.delete(`/flat/${id}/`);
  },

  getCategories: async (params = {}) => {
    const { data } = await apiClient.get('/category/', { params });
    return data;
  },
  createCategory: async (payload) => {
    const { data } = await apiClient.post('/category/', payload);
    return data;
  },
  updateCategory: async (id, payload) => {
    const { data } = await apiClient.patch(`/category/${id}/`, payload);
    return data;
  },
  deleteCategory: async (id) => {
    await apiClient.delete(`/category/${id}/`);
  },

  getSpecialCharges: async (params = {}) => {
    const { data } = await apiClient.get('/specialcharges/', { params });
    return data;
  },
  createSpecialCharge: async (payload) => {
    const { data } = await apiClient.post('/specialcharges/', payload);
    return data;
  },
  updateSpecialCharge: async (id, payload) => {
    const { data } = await apiClient.patch(`/specialcharges/${id}/`, payload);
    return data;
  },
  deleteSpecialCharge: async (id) => {
    await apiClient.delete(`/specialcharges/${id}/`);
  },
};

export default buildingService;
