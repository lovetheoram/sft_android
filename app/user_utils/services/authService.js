/**
 * =============================================================================
 * 🔐 AUTH SERVICE — Login, Signup, Profile (React Native)
 * =============================================================================
 */
import apiClient, { TOKEN_KEYS } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const authService = {
  login: async (credentials) => {
    const { data } = await apiClient.post('/token/', credentials);
    if (data.access) await AsyncStorage.setItem(TOKEN_KEYS.ACCESS, data.access);
    if (data.refresh) await AsyncStorage.setItem(TOKEN_KEYS.REFRESH, data.refresh);
    return data;
  },

  signup: async (userData) => {
    const { data } = await apiClient.post('/signup/', userData);
    if (data.access) await AsyncStorage.setItem(TOKEN_KEYS.ACCESS, data.access);
    if (data.refresh) await AsyncStorage.setItem(TOKEN_KEYS.REFRESH, data.refresh);
    return data;
  },

  getCurrentUser: async () => {
    const { data } = await apiClient.get('/currentUser/');
    return data;
  },

  refreshProfile: async () => {
    const { data } = await apiClient.get('/currentUser/');
    await AsyncStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(data));
    return data;
  },

  logout: async () => {
    await AsyncStorage.multiRemove([TOKEN_KEYS.ACCESS, TOKEN_KEYS.REFRESH, TOKEN_KEYS.USER]);
  },

  changePassword: async (payload) => {
    const { data } = await apiClient.post('/change-password/', payload);
    return data;
  },
};

export default authService;
