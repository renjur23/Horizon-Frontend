// src/api/axiosInstance.js
import axios from 'axios';

const baseURL = `${import.meta.env.VITE_BASE_URL}/api/`;

const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🔐 Attach access token to each request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔄 Auto-refresh token on 401 errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      const refresh_token = localStorage.getItem('refresh_token');

      if (!refresh_token) {
        // 🚪 No refresh token → force logout
        localStorage.removeItem('access_token');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${baseURL}token/refresh/`, {
          refresh: refresh_token,
        });

        const new_access_token = response.data.access;
        localStorage.setItem('access_token', new_access_token);

        // Update headers and retry
        axiosInstance.defaults.headers.Authorization = `Bearer ${new_access_token}`;
        originalRequest.headers.Authorization = `Bearer ${new_access_token}`;
        return axiosInstance(originalRequest);

      } catch (refreshError) {
        console.error('🚫 Refresh failed, logging out...');
        // 🚪 Refresh expired → clear and redirect
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
