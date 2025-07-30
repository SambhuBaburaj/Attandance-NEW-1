const express = require('express');
const router = express.Router();
const { 
  getMyChildren, 
  getChildAttendance, 
  getAttendanceSummary,
  getChildTodayAttendance,
  updateProfile,
  getProfile,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  sendMessageToTeacher,
  getMessages,
  getAttendanceReport,
  updatePushToken
} = require('../controllers/parentController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// All parent routes require authentication and PARENT role
router.use(authenticateToken);
router.use(authorizeRole(['PARENT']));

// Profile management
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Children and attendance
router.get('/my-children', getMyChildren);
router.get('/attendance-summary', getAttendanceSummary);
router.get('/today-attendance', getChildTodayAttendance);
router.get('/child-attendance/:studentId', getChildAttendance);
router.get('/attendance-report', getAttendanceReport);

// Notifications
router.get('/notifications', getNotifications);
router.put('/notifications/:notificationId/read', markNotificationAsRead);
router.put('/notifications/mark-all-read', markAllNotificationsAsRead);

// Messages with teachers
router.get('/messages', getMessages);
router.post('/messages', sendMessageToTeacher);

// Push notifications
router.post('/push-token', updatePushToken);

module.exports = router;