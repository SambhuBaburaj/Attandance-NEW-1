const express = require('express');
const router = express.Router();
const {
  getSchoolSettings,
  updateSchoolSettings,
  getAttendanceSettings,
  updateAttendanceSettings,
  getDashboardStats
} = require('../controllers/adminController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// All admin routes require authentication and ADMIN role
router.use(authenticateToken);
router.use(authorizeRole(['ADMIN']));

// School settings
router.get('/school-settings', getSchoolSettings);
router.post('/school-settings', updateSchoolSettings);

// Attendance settings  
router.get('/attendance-settings', getAttendanceSettings);
router.post('/attendance-settings', updateAttendanceSettings);

// Dashboard statistics
router.get('/dashboard-stats', getDashboardStats);

module.exports = router;