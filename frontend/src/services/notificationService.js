import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LocalNotificationService from './localNotificationService';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  static expoPushToken = null;
  static notificationListener = null;
  static responseListener = null;

  // Register for push notifications and get push token
  static async registerForPushNotifications() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }
      
      try {
        // Get the project ID from app.json/expo config
        token = await Notifications.getExpoPushTokenAsync();
        console.log('Expo Push Token:', token.data);
        
        // Store token locally
        await AsyncStorage.setItem('expoPushToken', token.data);
        this.expoPushToken = token.data;
        
        return token.data;
      } catch (error) {
        console.error('Error getting push token (expected in Expo Go):', error);
        console.log('Push notifications will use local notifications for testing');
        
        // Store a placeholder token to indicate local notification mode
        const localToken = `local-${Device.osName}-${Date.now()}`;
        await AsyncStorage.setItem('expoPushToken', localToken);
        this.expoPushToken = localToken;
        
        return localToken;
      }
    } else {
      console.log('Must use physical device for push notifications');
      return null;
    }
  }

  // Check if notifications are enabled
  static async areNotificationsEnabled() {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  // Request notification permissions
  static async requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  // Get stored push token
  static async getStoredPushToken() {
    try {
      const token = await AsyncStorage.getItem('expoPushToken');
      this.expoPushToken = token;
      return token;
    } catch (error) {
      console.error('Error getting stored push token:', error);
      return null;
    }
  }

  // Send push token to backend
  static async sendPushTokenToBackend(token, userId, apiClient) {
    try {
      await apiClient.post('/parents/push-token', {
        pushToken: token,
        userId: userId,
        platform: Platform.OS,
      });
      console.log('Push token sent to backend successfully');
    } catch (error) {
      console.error('Error sending push token to backend:', error);
    }
  }

  // Setup notification listeners
  static setupNotificationListeners(navigation) {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received while app is open:', notification);
      // You can show an in-app notification banner here if needed
    });

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      
      // Handle navigation based on notification data
      const notificationData = response.notification.request.content.data;
      if (notificationData && notificationData.screen) {
        navigation.navigate(notificationData.screen, notificationData.params || {});
      }
    });
  }

  // Remove notification listeners
  static removeNotificationListeners() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }
    
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }
  }

  // Schedule a local notification (for testing)
  static async scheduleLocalNotification(title, body, data = {}) {
    return await LocalNotificationService.scheduleLocalNotification(title, body, data);
  }

  // Check if we're in local notification mode (Expo Go)
  static isLocalNotificationMode() {
    return this.expoPushToken && this.expoPushToken.startsWith('local-');
  }

  // Simulate receiving a notification (for testing in Expo Go)
  static async simulateIncomingNotification(title, body, data = {}) {
    if (this.isLocalNotificationMode()) {
      return await LocalNotificationService.simulateIncomingNotification(title, body, data);
    } else {
      return await this.scheduleLocalNotification(title, body, data);
    }
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
}

export default NotificationService;