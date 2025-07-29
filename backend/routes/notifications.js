const express = require('express');
const router = express.Router();
const { 
  sendCustomNotification, 
  getNotificationTargets, 
  getNotificationHistory 
} = require('../controllers/notificationController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Send custom notification to parents (Admin and Teacher only)
router.post('/send', authenticateToken, authorizeRole(['ADMIN', 'TEACHER']), sendCustomNotification);

// Get available notification targets (classes and parents)
router.get('/targets', authenticateToken, authorizeRole(['ADMIN', 'TEACHER']), getNotificationTargets);

// Get notification history (for admin/teacher dashboard)
router.get('/history', authenticateToken, authorizeRole(['ADMIN', 'TEACHER']), getNotificationHistory);

module.exports = router;