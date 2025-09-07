const express = require('express');
const router = express.Router();
const {
  getAttendanceReport,
  getClassReport,
  getStudentReport,
  getTeacherReport,
  getDashboardStats
} = require('../controllers/reportController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Get attendance report
router.get('/attendance', authenticateToken, getAttendanceReport);

// Get class report
router.get('/class', authenticateToken, getClassReport);

// Get student report
router.get('/student', authenticateToken, getStudentReport);

// Get teacher report
router.get('/teacher', authenticateToken, authorizeRole(['ADMIN']), getTeacherReport);

// Get dashboard statistics
router.get('/dashboard-stats', authenticateToken, getDashboardStats);

module.exports = router;