const express = require('express');
const router = express.Router();
const {
  getAttendanceReport,
  getClassReport,
  getStudentReport,
  getTeacherReport,
  getDashboardStats
} = require('../controllers/reportController');
const auth = require('../middleware/auth');

// Get attendance report
router.get('/attendance', auth, getAttendanceReport);

// Get class report
router.get('/class', auth, getClassReport);

// Get student report
router.get('/student', auth, getStudentReport);

// Get teacher report
router.get('/teacher', auth, getTeacherReport);

// Get dashboard statistics
router.get('/dashboard-stats', auth, getDashboardStats);

module.exports = router;