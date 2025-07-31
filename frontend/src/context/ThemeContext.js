import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme !== null) {
        setIsDark(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDark;
      setIsDark(newTheme);
      await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const lightTheme = {
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#1f2937',
    textSecondary: '#6b7280',
    primary: '#3b82f6',
    primaryLight: '#dbeafe',
    primaryDark: '#1d4ed8',
    danger: '#ef4444',
    dangerLight: '#fecaca',
    success: '#10b981',
    successLight: '#d1fae5',
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    border: '#e5e7eb',
    card: '#ffffff',
    shadow: '#000000',
    gradient: {
      primary: ['#3b82f6', '#1d4ed8'],
      success: ['#10b981', '#059669'],
      danger: ['#ef4444', '#dc2626'],
      neutral: ['#f8fafc', '#e2e8f0'],
    },
    elevation: {
      low: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
      medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      },
      high: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
      },
    },
  };

  const darkTheme = {
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    primary: '#60a5fa',
    primaryLight: '#1e3a8a',
    primaryDark: '#93c5fd',
    danger: '#f87171',
    dangerLight: '#7f1d1d',
    success: '#34d399',
    successLight: '#064e3b',
    warning: '#fbbf24',
    warningLight: '#78350f',
    border: '#334155',
    card: '#1e293b',
    shadow: '#000000',
    gradient: {
      primary: ['#60a5fa', '#3b82f6'],
      success: ['#34d399', '#10b981'],
      danger: ['#f87171', '#ef4444'],
      neutral: ['#1e293b', '#0f172a'],
    },
    elevation: {
      low: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 1,
      },
      medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 4,
      },
      high: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 8,
      },
    },
  };

  const theme = isDark ? darkTheme : lightTheme;

  const value = {
    isDark,
    theme,
    toggleTheme,
    loading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};