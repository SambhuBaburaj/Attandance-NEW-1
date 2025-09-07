const { PrismaClient } = require('@prisma/client');
const PushNotificationService = require('./pushNotificationService');
const EmailService = require('./emailService');
const whatsappService = require('./whatsappService');
const SmsService = require('./smsService');

const prisma = new PrismaClient();

class UniversalNotificationService {
  
  /**
   * Send notification through all available channels based on parent preferences
   * @param {Array|String} parentIds - Array of parent IDs or single parent ID
   * @param {String} title - Notification title
   * @param {String} message - Notification message
   * @param {Object} options - Additional options
   */
  static async sendNotification(parentIds, title, message, options = {}) {
    const {
      priority = 'NORMAL',
      type = 'CUSTOM',
      sendWhatsApp = false,
      sendEmail = true,
      sendSms = false,
      studentId = null,
      sentBy = null,
      data = {}
    } = options;

    // Ensure parentIds is an array
    const targetParentIds = Array.isArray(parentIds) ? parentIds : [parentIds];
    
    if (targetParentIds.length === 0) {
      throw new Error('No parent IDs provided');
    }

    console.log(`📧 Starting notification send to ${targetParentIds.length} parents`);
    
    // Get parent details and preferences
    const parents = await prisma.parentProfile.findMany({
      where: { 
        id: { in: targetParentIds } 
      },
      include: {
        user: {
          select: { 
            id: true, 
            name: true, 
            email: true 
          }
        }
      }
    });

    if (parents.length === 0) {
      throw new Error('No valid parents found');
    }

    const results = {
      totalParents: parents.length,
      inAppNotifications: { sent: 0, failed: 0, errors: [] },
      pushNotifications: { sent: 0, failed: 0, errors: [] },
      emailNotifications: { sent: 0, failed: 0, errors: [] },
      whatsappNotifications: { sent: 0, failed: 0, errors: [] },
      smsNotifications: { sent: 0, failed: 0, errors: [] },
      overallSuccess: true
    };

    // Step 1: Create in-app notifications for all parents
    console.log('📱 Creating in-app notifications...');
    const inAppResults = await this.createInAppNotifications(
      parents, 
      title, 
      message, 
      type, 
      priority, 
      studentId, 
      sentBy
    );
    results.inAppNotifications = inAppResults;

    // Step 2: Send push notifications
    console.log('🔔 Sending push notifications...');
    const pushResults = await this.sendPushNotifications(
      targetParentIds, 
      title, 
      message, 
      priority, 
      data
    );
    results.pushNotifications = pushResults;

    // Step 3: Send email notifications (if enabled)
    if (sendEmail) {
      console.log('📧 Sending email notifications...');
      const emailResults = await this.sendEmailNotifications(
        parents, 
        title, 
        message, 
        priority,
        sentBy
      );
      results.emailNotifications = emailResults;
    }

    // Step 4: Send WhatsApp notifications (if enabled)
    if (sendWhatsApp) {
      console.log('📱 Sending WhatsApp notifications...');
      const whatsappResults = await this.sendWhatsAppNotifications(
        parents, 
        title, 
        message, 
        sentBy
      );
      results.whatsappNotifications = whatsappResults;
    }

    // Step 5: Send SMS notifications (if enabled and critical priority)
    if (sendSms || priority === 'HIGH') {
      console.log('📲 Sending SMS notifications...');
      const smsResults = await this.sendSmsNotifications(
        parents, 
        title, 
        message, 
        priority
      );
      results.smsNotifications = smsResults;
    }

    // Calculate overall success
    const totalSent = results.inAppNotifications.sent + 
                     results.pushNotifications.sent + 
                     results.emailNotifications.sent;
    const totalAttempted = results.totalParents * 3; // At least 3 channels attempted
    
    results.overallSuccess = (totalSent / totalAttempted) >= 0.5; // 50% success rate
    results.deliveryRate = Math.round((totalSent / totalAttempted) * 100);

    console.log(`✅ Notification sending completed. Delivery rate: ${results.deliveryRate}%`);
    
    return results;
  }

  /**
   * Create in-app notifications in database
   */
  static async createInAppNotifications(parents, title, message, type, priority, studentId, sentBy) {
    const results = { sent: 0, failed: 0, errors: [] };

    try {
      const notifications = await Promise.allSettled(
        parents.map(parent => 
          prisma.parentNotification.create({
            data: {
              parentId: parent.id,
              studentId,
              type,
              title,
              message,
              priority,
              sentBy
            }
          })
        )
      );

      notifications.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push({
            parentId: parents[index].id,
            error: result.reason?.message || 'Unknown error'
          });
        }
      });

    } catch (error) {
      console.error('Error creating in-app notifications:', error);
      results.failed = parents.length;
      results.errors.push({ error: error.message });
    }

    return results;
  }

  /**
   * Send push notifications via Expo/FCM
   */
  static async sendPushNotifications(parentIds, title, message, priority, data) {
    const results = { sent: 0, failed: 0, errors: [] };

    try {
      // Try Expo push notifications first
      const pushResult = await PushNotificationService.sendToMultipleParents(
        parentIds, 
        title, 
        message, 
        { ...data, priority }
      );

      if (pushResult.success) {
        results.sent = pushResult.sentCount || 0;
        
        // Skip push delivery status update for current schema  
        console.log('Push notifications sent successfully');
      } else {
        results.failed = parentIds.length;
        results.errors.push({ error: pushResult.error });
        
        // Skip delivery status update for current schema
        console.log('Push notification failed, but delivery status tracking not available in current schema');
      }

    } catch (error) {
      console.error('Push notification error:', error);
      results.failed = parentIds.length;
      results.errors.push({ error: error.message });
    }

    return results;
  }

  /**
   * Send email notifications
   */
  static async sendEmailNotifications(parents, title, message, priority, sentBy) {
    const results = { sent: 0, failed: 0, errors: [] };

    try {
      const emailResults = await Promise.allSettled(
        parents.map(parent => 
          EmailService.sendNotificationEmail(
            parent.user.email,
            parent.user.name,
            title,
            message,
            priority,
            sentBy
          )
        )
      );

      emailResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push({
            parentId: parents[index].id,
            email: parents[index].user.email,
            error: result.reason?.message || result.value?.error || 'Unknown error'
          });
        }
      });

      // Skip email delivery status update for current schema
      if (results.sent > 0) {
        console.log(`Email notifications sent successfully to ${results.sent} parents`);
      }

    } catch (error) {
      console.error('Email notification error:', error);
      results.failed = parents.length;
      results.errors.push({ error: error.message });
    }

    return results;
  }

  /**
   * Send WhatsApp notifications
   */
  static async sendWhatsAppNotifications(parents, title, message, sentBy) {
    const results = { sent: 0, failed: 0, errors: [] };

    try {
      // Filter parents who opted in for WhatsApp
      const whatsappParents = parents.filter(p => p.whatsappOptIn && p.phone);
      
      if (whatsappParents.length === 0) {
        console.log('No parents opted in for WhatsApp notifications');
        return results;
      }

      const whatsappData = whatsappParents.map(parent => ({
        parentId: parent.id,
        parentName: parent.user.name,
        parentPhone: parent.phone,
        title,
        message,
        senderName: sentBy || 'School System',
        senderRole: 'SYSTEM'
      }));

      const whatsappResult = await whatsappService.sendBulkCustomNotifications(whatsappData);

      results.sent = whatsappResult.sentCount || 0;
      results.failed = whatsappResult.errorCount || 0;
      results.errors = whatsappResult.errors || [];

      // Skip WhatsApp delivery status update for current schema
      if (results.sent > 0) {
        console.log(`WhatsApp notifications sent successfully to ${results.sent} parents`);
      }

    } catch (error) {
      console.error('WhatsApp notification error:', error);
      results.failed = parents.filter(p => p.whatsappOptIn && p.phone).length;
      results.errors.push({ error: error.message });
    }

    return results;
  }

  /**
   * Send SMS notifications for high priority alerts
   */
  static async sendSmsNotifications(parents, title, message, priority) {
    const results = { sent: 0, failed: 0, errors: [] };

    try {
      // Only send SMS for high priority or if specifically requested
      if (priority !== 'HIGH') {
        console.log('SMS notifications only sent for HIGH priority alerts');
        return results;
      }

      // Filter parents with phone numbers
      const smsParents = parents.filter(p => p.phone);
      
      if (smsParents.length === 0) {
        console.log('No parents with phone numbers for SMS');
        return results;
      }

      const smsResults = await Promise.allSettled(
        smsParents.map(parent => 
          SmsService.sendNotificationSms(
            parent.phone,
            parent.user.name,
            title,
            message
          )
        )
      );

      smsResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          results.sent++;
        } else {
          results.failed++;
          results.errors.push({
            parentId: smsParents[index].id,
            phone: smsParents[index].phone,
            error: result.reason?.message || result.value?.error || 'Unknown error'
          });
        }
      });

    } catch (error) {
      console.error('SMS notification error:', error);
      results.failed = parents.filter(p => p.phone).length;
      results.errors.push({ error: error.message });
    }

    return results;
  }

  /**
   * Update notification delivery status in database
   */
  static async updateNotificationDeliveryStatus(parentIds, title, field, value) {
    try {
      // Only update fields that exist in current schema
      const allowedFields = ['isRead', 'readAt'];
      if (!allowedFields.includes(field)) {
        console.log(`Field ${field} not available in current schema, skipping update`);
        return;
      }

      await prisma.parentNotification.updateMany({
        where: {
          parentId: { in: parentIds },
          title: title,
          sentAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
          }
        },
        data: {
          [field]: value
        }
      });
    } catch (error) {
      console.error(`Error updating ${field} status:`, error);
    }
  }

  /**
   * Send test notification to verify all channels
   */
  static async sendTestNotification(parentId) {
    const title = "🧪 Test Notification";
    const message = "This is a test notification from the School Attendance System. If you received this, notifications are working correctly!";
    
    return await this.sendNotification(
      parentId, 
      title, 
      message, 
      {
        priority: 'NORMAL',
        type: 'CUSTOM',
        sendWhatsApp: true,
        sendEmail: true,
        sendSms: false
      }
    );
  }

  /**
   * Send bulk notifications with intelligent batching
   */
  static async sendBulkNotifications(notifications) {
    const results = [];
    const batchSize = 50; // Process in batches to avoid overwhelming services

    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(notification => 
          this.sendNotification(
            notification.parentIds,
            notification.title,
            notification.message,
            notification.options || {}
          )
        )
      );

      results.push(...batchResults);
      
      // Small delay between batches to prevent rate limiting
      if (i + batchSize < notifications.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Get notification delivery statistics
   */
  static async getDeliveryStats(startDate = null, endDate = null) {
    try {
      const dateFilter = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);

      const totalCount = await prisma.parentNotification.count({
        where: startDate || endDate ? { sentAt: dateFilter } : {}
      });

      // Basic stats using existing schema
      const deliveredCount = await prisma.parentNotification.count({
        where: {
          isRead: true,
          ...(startDate || endDate ? { sentAt: dateFilter } : {})
        }
      });

      return {
        totalNotifications: totalCount || 0,
        deliveredNotifications: deliveredCount || 0,
        deliveryRate: totalCount > 0 ? Math.round((deliveredCount / totalCount) * 100) : 0,
        period: {
          startDate: startDate ? new Date(startDate).toISOString() : null,
          endDate: endDate ? new Date(endDate).toISOString() : null
        }
      };
    } catch (error) {
      console.error('Error getting delivery stats:', error);
      return {
        totalNotifications: 0,
        deliveredNotifications: 0,
        deliveryRate: 0,
        error: 'Unable to fetch stats with current database schema'
      };
    }
  }
}

module.exports = UniversalNotificationService;