/**
 * =============================================================================
 * 🏘️ SOCIETY SERVICE — Announcements, Complaints, Documents, Notifications (RN)
 * =============================================================================
 */
import apiClient from '../api';

const societyService = {
  // ── Announcements ──────────────────────────────────────────────────────────
  getAnnouncements: async (params = {}) => {
    const { data } = await apiClient.get('/announcements/', { params });
    return data;
  },
  createAnnouncement: async (announcementData) => {
    const { data } = await apiClient.post('/announcements/', announcementData);
    return data;
  },
  updateAnnouncement: async (id, announcementData) => {
    const { data } = await apiClient.put(`/announcements/${id}/`, announcementData);
    return data;
  },
  deleteAnnouncement: async (id) => {
    await apiClient.delete(`/announcements/${id}/`);
  },

  // ── Complaints ─────────────────────────────────────────────────────────────
  getComplaints: async (params = {}) => {
    const { data } = await apiClient.get('/complaints/', { params });
    return data;
  },
  createComplaint: async (complaintData) => {
    const { data } = await apiClient.post('/complaints/', complaintData);
    return data;
  },
  updateComplaint: async (id, payload) => {
    const { data } = await apiClient.patch(`/complaints/${id}/`, payload);
    return data;
  },
  addComplaintComment: async (commentData) => {
    const { data } = await apiClient.post('/complaint-comments/', commentData);
    return data;
  },
  deleteComplaint: async (id) => {
    await apiClient.delete(`/complaints/${id}/`);
  },

  // ── Documents ──────────────────────────────────────────────────────────────
  getDocuments: async (params = {}) => {
    const { data } = await apiClient.get('/documents/', { params });
    return data;
  },
  uploadDocument: async (formData) => {
    const { data } = await apiClient.post('/documents/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  deleteDocument: async (id) => {
    await apiClient.delete(`/documents/${id}/`);
  },

  // ── Notifications ──────────────────────────────────────────────────────────
  getNotifications: async (params = {}) => {
    const { data } = await apiClient.get('/notifications/', { params });
    return data;
  },
  getNotification: async (id) => {
    const { data } = await apiClient.get(`/notifications/${id}/`);
    return data;
  },
  markNotificationSeen: async (id) => {
    const { data } = await apiClient.patch(`/notifications/${id}/`, { seen: true });
    return data;
  },

  // ── Users (admin) ──────────────────────────────────────────────────────────
  getUsers: async (params = {}) => {
    const { data } = await apiClient.get('/users/', { params });
    return data;
  },
  updateUser: async (id, payload) => {
    const { data } = await apiClient.patch(`/users/${id}/`, payload);
    return data;
  },
  deleteUser: async (id) => {
    await apiClient.delete(`/users/${id}/`);
  },
};

export default societyService;
