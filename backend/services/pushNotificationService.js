const { Expo } = require('expo-server-sdk');
const { PrismaClient } = require('@prisma/client');

const expo = new Expo();
const prisma = new PrismaClient();

class PushNotificationService {
  // Send push notification to specific parent
  static async sendToParent(parentId, title, message, data = {}) {
    try {
      // Get parent's push token
      const parent = await prisma.parentProfile.findUnique({
        where: { id: parentId },
        select: { pushToken: true, pushTokenPlatform: true }
      });

      if (!parent || !parent.pushToken) {
        console.log(`No push token found for parent ${parentId}`);
        return { success: false, error: 'No push token found' };
      }

      // Check that the push token is valid
      if (!Expo.isExpoPushToken(parent.pushToken)) {
        console.error(`Push token ${parent.pushToken} is not a valid Expo push token`);
        return { success: false, error: 'Invalid push token' };
      }

      // Construct the push message
      const pushMessage = {
        to: parent.pushToken,
        sound: 'default',
        title: title,
        body: message,
        data: data,
        priority: 'high',
        channelId: 'default',
      };

      // Send the push notification
      const result = await this.sendPushNotifications([pushMessage]);
      
      console.log(`Push notification sent to parent ${parentId}:`, result);
      return { success: true, result };

    } catch (error) {
      console.error(`Error sending push notification to parent ${parentId}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Send push notifications to multiple parents
  static async sendToMultipleParents(parentIds, title, message, data = {}) {
    try {
      // Get all parent push tokens
      const parents = await prisma.parentProfile.findMany({
        where: { 
          id: { in: parentIds },
          pushToken: { not: null }
        },
        select: { id: true, pushToken: true, pushTokenPlatform: true }
      });

      if (parents.length === 0) {
        console.log('No parents with push tokens found');
        return { success: false, error: 'No parents with push tokens found' };
      }

      // Create push messages for all parents
      const pushMessages = parents
        .filter(parent => Expo.isExpoPushToken(parent.pushToken))
        .map(parent => ({
          to: parent.pushToken,
          sound: 'default',
          title: title,
          body: message,
          data: { ...data, parentId: parent.id },
          priority: 'high',
          channelId: 'default',
        }));

      if (pushMessages.length === 0) {
        console.log('No valid push tokens found');
        return { success: false, error: 'No valid push tokens found' };
      }

      // Send the push notifications
      const result = await this.sendPushNotifications(pushMessages);
      
      console.log(`Push notifications sent to ${pushMessages.length} parents:`, result);
      return { success: true, result, sentCount: pushMessages.length };

    } catch (error) {
      console.error('Error sending push notifications to multiple parents:', error);
      return { success: false, error: error.message };
    }
  }

  // Send push notifications to all parents
  static async sendToAllParents(title, message, data = {}) {
    try {
      // Get all parent push tokens
      const parents = await prisma.parentProfile.findMany({
        where: { 
          pushToken: { not: null },
          notifications: true // Only send to parents who have notifications enabled
        },
        select: { id: true, pushToken: true, pushTokenPlatform: true }
      });

      if (parents.length === 0) {
        console.log('No parents with push tokens found');
        return { success: false, error: 'No parents with push tokens found' };
      }

      const parentIds = parents.map(p => p.id);
      return await this.sendToMultipleParents(parentIds, title, message, data);

    } catch (error) {
      console.error('Error sending push notifications to all parents:', error);
      return { success: false, error: error.message };
    }
  }

  // Core function to send push notifications using Expo SDK
  static async sendPushNotifications(messages) {
    try {
      // Break messages into chunks of 100 (Expo's limit)
      const chunks = expo.chunkPushNotifications(messages);
      const tickets = [];

      // Send each chunk
      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending push notification chunk:', error);
        }
      }

      // Process tickets and handle any errors
      const receiptIds = [];
      const errors = [];

      for (let i = 0; i < tickets.length; i++) {
        const ticket = tickets[i];
        if (ticket.status === 'error') {
          console.error(`Push notification error for message ${i}:`, ticket.message);
          errors.push({ index: i, error: ticket.message, details: ticket.details });
        } else if (ticket.status === 'ok') {
          receiptIds.push(ticket.id);
        }
      }

      // Get receipts for successful sends (optional - for detailed tracking)
      let receipts = [];
      if (receiptIds.length > 0) {
        try {
          const receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
          
          for (const chunk of receiptIdChunks) {
            const receiptChunk = await expo.getPushNotificationReceiptsAsync(chunk);
            receipts.push(...Object.entries(receiptChunk));
          }
        } catch (receiptError) {
          console.error('Error getting push notification receipts:', receiptError);
        }
      }

      return {
        totalSent: messages.length,
        successful: tickets.filter(t => t.status === 'ok').length,
        failed: errors.length,
        errors: errors,
        tickets: tickets,
        receipts: receipts
      };

    } catch (error) {
      console.error('Error in sendPushNotifications:', error);
      throw error;
    }
  }

  // Send notification for student absence
  static async sendAbsenceNotification(parentId, studentName, className, date, remarks = '') {
    const title = `${studentName} was absent today`;
    const message = `Your child ${studentName} was marked absent in ${className} on ${date}.${remarks ? ` Remarks: ${remarks}` : ''}`;
    
    const data = {
      type: 'absence',
      studentName,
      className,
      date,
      remarks,
      screen: 'ParentDashboard' // Navigate to parent dashboard when tapped
    };

    return await this.sendToParent(parentId, title, message, data);
  }

  // Send custom notification (from admin)
  static async sendCustomNotification(parentIds, title, message, priority = 'NORMAL') {
    const data = {
      type: 'custom',
      priority,
      screen: 'ParentDashboard',
      timestamp: new Date().toISOString()
    };

    if (Array.isArray(parentIds)) {
      return await this.sendToMultipleParents(parentIds, title, message, data);
    } else {
      return await this.sendToParent(parentIds, title, message, data);
    }
  }

  // Test push notification functionality
  static async sendTestNotification(parentId) {
    const title = "Test Notification";
    const message = "This is a test push notification from SchoolSync!";
    const data = {
      type: 'test',
      screen: 'ParentDashboard'
    };

    return await this.sendToParent(parentId, title, message, data);
  }
}

module.exports = PushNotificationService;