import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';
import NotificationService from '../services/notificationService';
import apiClient from '../services/apiClient';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is already logged in on app start
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const storedToken = await authService.getToken();
      const storedUser = await authService.getStoredUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
        setIsAuthenticated(true);
        
        // Setup push notifications for returning users
        await setupPushNotifications(storedUser, storedToken);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      await logout();
    } finally {
      setLoading(false);
    }
  };

  const setupPushNotifications = async (user, authToken) => {
    try {
      // Only setup push notifications for parents
      if (user.role === 'PARENT') {
        // Get or register for push token
        let pushToken = await NotificationService.getStoredPushToken();
        if (!pushToken) {
          pushToken = await NotificationService.registerForPushNotifications();
        }
        
        // Send token to backend if we have one
        if (pushToken && authToken) {
          await NotificationService.sendPushTokenToBackend(pushToken, user.id, apiClient);
        }
      }
    } catch (error) {
      console.error('Error setting up push notifications:', error);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await authService.login(email, password);
      
      setToken(response.token);
      setUser(response.user);
      setIsAuthenticated(true);
      
      // Setup push notifications after successful login
      await setupPushNotifications(response.user, response.token);
      
      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const adminSignup = async (email, password, name) => {
    try {
      setLoading(true);
      const response = await authService.adminSignup(email, password, name);
      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const getUserRole = () => {
    return user?.role || null;
  };

  const isAdmin = () => {
    return user?.role === 'ADMIN';
  };

  const isTeacher = () => {
    return user?.role === 'TEACHER';
  };

  const isParent = () => {
    return user?.role === 'PARENT';
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    adminSignup,
    logout,
    getUserRole,
    isAdmin,
    isTeacher,
    isParent,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;