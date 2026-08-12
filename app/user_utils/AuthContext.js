/**
 * =============================================================================
 * 🔐 AUTH CONTEXT — Global Auth State for React Native (SFT Android)
 * =============================================================================
 * Provides: user, isAuthenticated, isSuperAdmin, isBuildingAdmin, isAdmin,
 *           isResident, hasFlatAssigned, flatId, buildingId
 * Methods:  login(), logout(), refreshProfile()
 * Storage:  AsyncStorage (access_token / refresh_token / user_profile)
 * =============================================================================
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, { TOKEN_KEYS, API_BASE_URL } from './api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Initial Auth Verification ───────────────────────────────────────────────
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_KEYS.ACCESS);
        if (storedToken) {
          // Fetch live profile to verify token is still valid
          const { data } = await apiClient.get('/currentUser/');
          setUser(data);
          setToken(storedToken);
          await AsyncStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(data));
        }
      } catch {
        // Token invalid/expired — clear everything
        await AsyncStorage.multiRemove([TOKEN_KEYS.ACCESS, TOKEN_KEYS.REFRESH, TOKEN_KEYS.USER]);
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Register global logout callback for the Axios interceptor
    globalThis._authLogoutCallback = () => {
      setUser(null);
      setToken(null);
    };

    return () => {
      globalThis._authLogoutCallback = null;
    };
  }, []);

  // ── Login ───────────────────────────────────────────────────────────────────
  const login = useCallback(async ({ username, password }) => {
    const { data } = await apiClient.post('/token/', { username, password });

    const accessToken = data.access;
    const refreshToken = data.refresh;

    await AsyncStorage.setItem(TOKEN_KEYS.ACCESS, accessToken);
    await AsyncStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken);

    // Fetch user profile
    const profileRes = await apiClient.get('/currentUser/');
    const userData = profileRes.data;

    await AsyncStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(userData));
    setUser(userData);
    setToken(accessToken);
    return userData;
  }, []);

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove([TOKEN_KEYS.ACCESS, TOKEN_KEYS.REFRESH, TOKEN_KEYS.USER]);
    setUser(null);
    setToken(null);
  }, []);

  // ── Refresh Profile ─────────────────────────────────────────────────────────
  const refreshProfile = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/currentUser/');
      setUser(data);
      await AsyncStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(data));
      return data;
    } catch (err) {
      await logout();
      throw err;
    }
  }, [logout]);

  // ── Derived Role Flags ──────────────────────────────────────────────────────
  const isSuperAdmin = user?.role === 'admin' && !user?.flat;
  const isBuildingAdmin = user?.role === 'admin' && !!user?.flat;
  const isAdmin = user?.role === 'admin';
  const isResident = user?.role === 'resident';
  const hasFlatAssigned = !!user?.flat;
  const flatId = user?.flat?.id ?? user?.flat ?? null;
  const buildingId = user?.flat?.building?.id ?? null;

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    role: user?.role ?? 'guest',
    isAdmin,
    isSuperAdmin,
    isBuildingAdmin,
    isResident,
    hasFlatAssigned,
    flatId,
    buildingId,
    login,
    logout,
    refreshProfile,
    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
