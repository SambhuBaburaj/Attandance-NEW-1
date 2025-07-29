import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';

export const authService = {
  async login(email, password) {
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });

      const data = response.data;

      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      return data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  },

  async adminSignup(email, password, name) {
    try {
      
      const response = await apiClient.post('/auth/admin-signup', {
        email,
        password,
        name,
        role: 'ADMIN',
      });

      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Signup failed');
    }
  },

  async logout() {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  },

  async getStoredUser() {
    try {
      const user = await AsyncStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      return null;
    }
  },

  async getToken() {
    return await AsyncStorage.getItem('token');
  }
};