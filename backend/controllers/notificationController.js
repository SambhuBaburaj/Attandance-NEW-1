const { PrismaClient } = require('@prisma/client');
const UniversalNotificationService = require('../services/universalNotificationService');
const whatsappService = require('../services/whatsappService');
const PushNotificationService = require('../services/pushNotificationService');
const prisma = new PrismaClient();

// Send custom notification to specific parent(s)
const sendCustomNotification = async (req, res) => {
  try {
    const { 
      title, 
      message, 
      targetType, // 'SPECIFIC', 'ALL_PARENTS', 'CLASS_PARENTS'
      targetIds, // Array of parent IDs or class IDs depending on targetType
      priority = 'NORMAL', // 'HIGH', 'NORMAL', 'LOW'
      sendWhatsApp = false 
    } = req.body;
    const userId = req.user.id;

    if (!title || !message || !targetType) {
      return res.status(400).json({ 
        error: 'Title, message, and target type are required' 
      });
    }

    let targetParents = [];

    // Determine target parents based on targetType
    switch (targetType) {
      case 'SPECIFIC':
        if (!targetIds || !Array.isArray(targetIds) || targetIds.length === 0) {
          return res.status(400).json({ 
            error: 'Parent IDs are required for specific targeting' 
          });
        }
        
        targetParents = await prisma.parentProfile.findMany({
          where: { 
            id: { in: targetIds } 
          },
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        });
        break;

      case 'ALL_PARENTS':
        targetParents = await prisma.parentProfile.findMany({
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        });
        break;

      case 'CLASS_PARENTS':
        if (!targetIds || !Array.isArray(targetIds) || targetIds.length === 0) {
          return res.status(400).json({ 
            error: 'Class IDs are required for class targeting' 
          });
        }

        // Get all parents who have children in the specified classes
        const studentsInClasses = await prisma.student.findMany({
          where: {
            classId: { in: targetIds },
            isActive: true
          },
          select: {
            parentId: true
          }
        });

        const parentIds = [...new Set(studentsInClasses.map(s => s.parentId))];
        
        targetParents = await prisma.parentProfile.findMany({
          where: { 
            id: { in: parentIds } 
          },
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        });
        break;

      default:
        return res.status(400).json({ 
          error: 'Invalid target type. Must be SPECIFIC, ALL_PARENTS, or CLASS_PARENTS' 
        });
    }

    if (targetParents.length === 0) {
      return res.status(404).json({ 
        error: 'No target parents found' 
      });
    }

    // Use Universal Notification Service to send all types of notifications
    const parentIds = targetParents.map(p => p.id);
    
    try {
      const result = await UniversalNotificationService.sendNotification(
        parentIds,
        title,
        message,
        {
          priority,
          type: 'CUSTOM',
          sendWhatsApp,
          sendEmail: true,
          sendSms: priority === 'HIGH',
          sentBy: req.user.name
        }
      );

      console.log('Universal notification result:', result);

      res.status(201).json({
        message: 'Notifications sent successfully',
        notificationsSent: result.totalParents,
        targetType,
        deliveryRate: result.deliveryRate + '%',
        overallSuccess: result.overallSuccess,
        results: {
          inApp: {
            sent: result.inAppNotifications.sent,
            failed: result.inAppNotifications.failed,
            errors: result.inAppNotifications.errors
          },
          push: {
            sent: result.pushNotifications.sent,
            failed: result.pushNotifications.failed,
            errors: result.pushNotifications.errors
          },
          email: {
            sent: result.emailNotifications.sent,
            failed: result.emailNotifications.failed,
            errors: result.emailNotifications.errors
          },
          whatsapp: sendWhatsApp ? {
            sent: result.whatsappNotifications.sent,
            failed: result.whatsappNotifications.failed,
            errors: result.whatsappNotifications.errors
          } : null,
          sms: (priority === 'HIGH') ? {
            sent: result.smsNotifications.sent,
            failed: result.smsNotifications.failed,
            errors: result.smsNotifications.errors
          } : null
        }
      });

    } catch (error) {
      console.error('Universal notification service error:', error);
      
      // Fallback to old method if universal service fails
      console.log('Falling back to original notification method...');
      
      const notifications = [];
      const whatsappData = [];

      for (const parent of targetParents) {
        // Create in-app notification
        const notification = await prisma.parentNotification.create({
          data: {
            parentId: parent.id,
            type: 'CUSTOM',
            title,
            message,
            priority,
            sentBy: userId,
            deliveryStatus: 'PENDING'
          }
        });

        notifications.push(notification);

        // Prepare WhatsApp notification if requested and parent opted in
        if (sendWhatsApp && parent.whatsappOptIn && parent.phone) {
          whatsappData.push({
            parentId: parent.id,
            parentName: parent.user.name,
            parentPhone: parent.phone,
            title,
            message,
            senderName: req.user.name,
            senderRole: req.user.role
          });
        }
      }

      // Send push notifications
      let pushResult = null;
      try {
        pushResult = await PushNotificationService.sendCustomNotification(
          parentIds,
          title,
          message,
          priority
        );
      } catch (pushError) {
        console.error('Push notification fallback failed:', pushError);
      }

      // Send WhatsApp notifications if requested
      let whatsappResult = null;
      if (whatsappData.length > 0) {
        try {
          whatsappResult = await whatsappService.sendBulkCustomNotifications(whatsappData);
        } catch (whatsappError) {
          console.error('WhatsApp notification fallback failed:', whatsappError);
        }
      }

      res.status(201).json({
        message: 'Notifications sent using fallback method',
        notificationsSent: notifications.length,
        targetType,
        fallbackUsed: true,
        pushNotificationResult: pushResult ? {
          success: pushResult.success,
          sent: pushResult.result?.successful || 0,
          failed: pushResult.result?.failed || 0
        } : null,
        whatsappResult: whatsappResult ? {
          sent: whatsappResult.sentCount,
          failed: whatsappResult.errorCount,
          errors: whatsappResult.errors
        } : null
      });
    }

  } catch (error) {
    console.error('Error sending custom notification:', error);
    res.status(500).json({ error: 'Failed to send custom notification' });
  }
};

// Get available target options (classes and parents for UI)
const getNotificationTargets = async (req, res) => {
  try {
    // Get all classes
    const classes = await prisma.class.findMany({
      select: {
        id: true,
        name: true,
        grade: true,
        section: true,
        _count: {
          select: {
            students: {
              where: { isActive: true }
            }
          }
        }
      },
      orderBy: [
        { grade: 'asc' },
        { section: 'asc' },
        { name: 'asc' }
      ]
    });

    // Get all parents
    const parents = await prisma.parentProfile.findMany({
      select: {
        id: true,
        phone: true,
        whatsappOptIn: true,
        user: {
          select: {
            name: true,
            email: true
          }
        },
        children: {
          where: { isActive: true },
          select: {
            name: true,
            rollNumber: true,
            class: {
              select: {
                name: true,
                grade: true,
                section: true
              }
            }
          }
        }
      },
      orderBy: {
        user: { name: 'asc' }
      }
    });

    // Get total parent count
    const totalParents = await prisma.parentProfile.count();

    res.json({
      classes: classes.map(cls => ({
        id: cls.id,
        name: cls.name,
        grade: cls.grade,
        section: cls.section,
        displayName: `${cls.name} - Grade ${cls.grade}${cls.section ? ` (${cls.section})` : ''}`,
        studentCount: cls._count.students
      })),
      parents: parents.map(parent => ({
        id: parent.id,
        name: parent.user.name,
        email: parent.user.email,
        phone: parent.phone,
        whatsappOptIn: parent.whatsappOptIn,
        children: parent.children
      })),
      summary: {
        totalClasses: classes.length,
        totalParents: totalParents,
        totalWhatsAppOptIns: parents.filter(p => p.whatsappOptIn).length
      }
    });

  } catch (error) {
    console.error('Error fetching notification targets:', error);
    res.status(500).json({ error: 'Failed to fetch notification targets' });
  }
};

// Get notification history (for admin/teacher to see sent notifications)
const getNotificationHistory = async (req, res) => {
  try {
    const { limit = 20, offset = 0, type, targetType } = req.query;

    const whereClause = {
      type: 'CUSTOM'
    };

    if (type && type !== 'all') {
      whereClause.type = type;
    }

    const notifications = await prisma.parentNotification.findMany({
      where: whereClause,
      include: {
        parent: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
        sender: {
          select: { name: true, role: true }
        },
        student: {
          select: { name: true, rollNumber: true }
        }
      },
      orderBy: {
        sentAt: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    // Group notifications by sender and sent time for better display
    const groupedNotifications = {};
    notifications.forEach(notification => {
      const key = `${notification.sentBy}_${notification.sentAt.toISOString().split('T')[0]}_${notification.title}`;
      
      if (!groupedNotifications[key]) {
        groupedNotifications[key] = {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          priority: notification.priority,
          type: notification.type,
          sentAt: notification.sentAt,
          sender: notification.sender,
          recipients: []
        };
      }
      
      groupedNotifications[key].recipients.push({
        parent: notification.parent,
        student: notification.student,
        isRead: notification.isRead,
        readAt: notification.readAt
      });
    });

    const totalCount = await prisma.parentNotification.count({
      where: whereClause
    });

    res.json({
      notifications: Object.values(groupedNotifications),
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: totalCount > parseInt(offset) + parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching notification history:', error);
    res.status(500).json({ error: 'Failed to fetch notification history' });
  }
};

module.exports = {
  sendCustomNotification,
  getNotificationTargets,
  getNotificationHistory
};