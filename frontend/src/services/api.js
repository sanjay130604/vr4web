import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://backend.vr4web.com/api' : '/api'),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Bearer token if available
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If unauthenticated on protected routes, can trigger redirect or clear state
    if (error.response && error.response.status === 401) {
      // Session expired or unauthenticated
    }
    return Promise.reject(error);
  }
);

export default api;

