import api from './api';

export const createSession = async (data = {}) => {
  const response = await api.post('/sessions/create', data);
  return response.data;
};

export const getSessions = async (params = {}) => {
  const response = await api.get('/sessions', { params });
  return response.data;
};

export const getSessionById = async (id) => {
  const response = await api.get(`/sessions/${id}`);
  return response.data;
};

export const updateSessionState = async (id, targetState, reason, progress) => {
  const response = await api.patch(`/sessions/${id}/state`, {
    targetState,
    reason,
    progress,
  });
  return response.data;
};

export const cancelSession = async (id, reason) => {
  const response = await api.post(`/sessions/${id}/cancel`, { reason });
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await api.get('/sessions/stats');
  return response.data;
};
