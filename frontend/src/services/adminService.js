import api from './api';

export const getUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

export const toggleUserBlock = async (userId) => {
  const response = await api.patch(`/admin/users/${userId}/toggle-block`);
  return response.data;
};

export const getAdminSessions = async (params = {}) => {
  const response = await api.get('/admin/sessions', { params });
  return response.data;
};

export const getSecurityLogs = async (params = {}) => {
  const response = await api.get('/admin/logs', { params });
  return response.data;
};

export const getAdminTelemetry = async () => {
  const response = await api.get('/admin/stats');
  return response.data;
};
