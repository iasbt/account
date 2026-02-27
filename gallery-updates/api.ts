import axios from 'axios';
import { getStoredToken, getRefreshToken, setStoredToken, setRefreshToken, clearAuth } from './auth-utils';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = getRefreshToken();

      if (refreshToken) {
        try {
          const accountUrl = import.meta.env.VITE_ACCOUNT_URL?.replace(/\/$/, '');
          const clientId = import.meta.env.VITE_CLIENT_ID || 'gallery-client';
          // Note: client_secret is NOT used here for public clients (SPA) with PKCE flow,
          // BUT our backend implementation currently requires it for refresh_token grant if it's a confidential client.
          // For SPA, we should ensure the backend allows public clients to refresh without secret if they used PKCE.
          // Assuming our backend requires client_id for refresh.
          
          const response = await axios.post(`${accountUrl}/api/oauth/token`, {
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: clientId,
          });

          const { access_token, refresh_token: newRefreshToken } = response.data;

          setStoredToken(access_token);
          if (newRefreshToken) {
            setRefreshToken(newRefreshToken);
          }

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          console.warn('Token refresh failed:', refreshError);
          clearAuth();
          if (window.location.pathname !== '/' && window.location.pathname !== '/signin') {
            window.location.href = '/';
          }
        }
      } else {
        clearAuth();
        if (window.location.pathname !== '/' && window.location.pathname !== '/signin') {
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(error);
  }
);
