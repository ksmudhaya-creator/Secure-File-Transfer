import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: inject JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: handle global auth revocation or blocked user
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      if (
        error.response.data?.message?.includes('blocked') ||
        error.response.data?.message?.includes('expired')
      ) {
        // Clear token if user is blocked or session revoked
        // But don't redirect if already on login page
        if (!window.location.pathname.includes('/login')) {
          // Keep token for modal alert or let context trigger logout
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
