import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class LocalNotificationService {
  // Schedule a local notification immediately
  static async scheduleLocalNotification(title, body, data = {}) {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          console.log('Notification permissions denied');
          return false;
        }
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // Show immediately
      });

      console.log('Local notification scheduled:', title);
      return true;
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      return false;
    }
  }

  // Simulate receiving a push notification (for testing)
  static async simulateIncomingNotification(title, body, data = {}) {
    return await this.scheduleLocalNotification(title, body, data);
  }

  // Clear all notifications
  static async clearAllNotifications() {
    await Notifications.dismissAllNotificationsAsync();
  }

  // Get notification permission status
  static async getPermissionStatus() {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  }

  // Request notification permissions
  static async requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  // Store notification data locally (for when push notifications are available)
  static async storeNotificationData(notificationData) {
    try {
      const existingData = await AsyncStorage.getItem('pendingNotifications');
      const notifications = existingData ? JSON.parse(existingData) : [];
      
      notifications.push({
        ...notificationData,
        timestamp: new Date().toISOString(),
        id: Date.now().toString()
      });

      await AsyncStorage.setItem('pendingNotifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error storing notification data:', error);
    }
  }

  // Get stored notifications
  static async getStoredNotifications() {
    try {
      const data = await AsyncStorage.getItem('pendingNotifications');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting stored notifications:', error);
      return [];
    }
  }

  // Clear stored notifications
  static async clearStoredNotifications() {
    try {
      await AsyncStorage.removeItem('pendingNotifications');
    } catch (error) {
      console.error('Error clearing stored notifications:', error);
    }
  }
}

export default LocalNotificationService;