import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

// Attach Authorization header if JWT token is stored in localStorage
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pulse_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

let isHandling401 = false;

// Response interceptor to handle HTTP 401 Unauthorized responses cleanly
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Only clear token if one existed to prevent interceptor loops on login failures
      if (localStorage.getItem('pulse_token')) {
        localStorage.removeItem('pulse_token');
        if (!isHandling401) {
          isHandling401 = true;
          window.dispatchEvent(new Event('auth:unauthorized'));
          setTimeout(() => {
            isHandling401 = false;
          }, 1000);
        }
      }
    }
    return Promise.reject(error);
  },
);

export default API;
