/**
 * =============================================================================
 * 🌐 CENTRALIZED AXIOS API CLIENT — React Native (AsyncStorage JWT Refresh)
 * =============================================================================
 * - Auto-attaches Bearer JWT token to every request via AsyncStorage
 * - Silently refreshes expired access tokens via /api/token/refresh/
 * - Queues concurrent requests during token refresh
 * - Dispatches 'auth_logout' event on unrecoverable 401
 * - Token keys: access_token / refresh_token (snake_case — CANONICAL)
 * =============================================================================
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── API Base URL ──────────────────────────────────────────────────────────────
export const API_BASE_URL = 'https://sft-backend-apih.onrender.com';

const BASE_URL = `${API_BASE_URL}/api`;

// ── Token Storage Keys — CANONICAL snake_case ─────────────────────────────────
export const TOKEN_KEYS = {
  ACCESS: 'access_token',    // ✅ canonical key — NEVER 'accessToken' (camelCase was a bug)
  REFRESH: 'refresh_token',
  USER: 'user_profile',
};

// ── Axios Instance ─────────────────────────────────────────────────────────────
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ── Request Interceptor — Auto-attach JWT ──────────────────────────────────────
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEYS.ACCESS);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Storage read failed silently
    }
    config._retryCount = config._retryCount ?? 0;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── JWT Refresh Queue State ────────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) =>
    error ? prom.reject(error) : prom.resolve(token)
  );
  failedQueue = [];
};

const forceLogout = async () => {
  await AsyncStorage.multiRemove([TOKEN_KEYS.ACCESS, TOKEN_KEYS.REFRESH, TOKEN_KEYS.USER]);
  // Emit logout event for AuthContext to react to
  if (typeof globalThis._authLogoutCallback === 'function') {
    globalThis._authLogoutCallback();
  }
};

// ── Response Interceptor — 401 JWT Refresh Flow ────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    const isAuthEndpoint =
      originalRequest?.url?.includes('/token/') ||
      originalRequest?.url?.includes('/signup/');

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      const refreshToken = await AsyncStorage.getItem(TOKEN_KEYS.REFRESH);

      if (!refreshToken) {
        await forceLogout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${BASE_URL}/token/refresh/`, {
          refresh: refreshToken,
        });

        const newAccessToken = data.access;
        await AsyncStorage.setItem(TOKEN_KEYS.ACCESS, newAccessToken);
        if (data.refresh) {
          await AsyncStorage.setItem(TOKEN_KEYS.REFRESH, data.refresh);
        }

        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await forceLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
