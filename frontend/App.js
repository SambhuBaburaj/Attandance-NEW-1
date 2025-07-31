import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import NotificationService from './src/services/notificationService';

export default function App() {
  useEffect(() => {
    // Initialize notifications when app starts
    const initializeNotifications = async () => {
      try {
        await NotificationService.registerForPushNotifications();
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initializeNotifications();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}