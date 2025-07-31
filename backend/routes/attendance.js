const express = require('express');
const router = express.Router();
const {
  getAttendanceByClassAndDate,
  markAttendance,
  getAttendanceHistory,
  getAttendanceStats,
  getDetailedAttendanceByDate,
  deleteAttendanceRecord,
  getAttendanceByDateRange,
  getAllClassesAttendanceSummary,
  getAdminAttendanceReport
} = require('../controllers/attendanceController');
const { authenticateToken } = require('../middleware/auth');

// Get attendance for a specific class and date
router.get('/', authenticateToken, getAttendanceByClassAndDate);

// Mark attendance for students
router.post('/mark', authenticateToken, markAttendance);

// Get attendance history for a class
router.get('/history/:classId', authenticateToken, getAttendanceHistory);

// Get attendance statistics for a class
router.get('/stats/:classId', authenticateToken, getAttendanceStats);

// Get detailed attendance for a specific date
router.get('/detailed', authenticateToken, getDetailedAttendanceByDate);

// Get attendance by date range with modern UI support
router.get('/range', authenticateToken, getAttendanceByDateRange);

// Admin-specific routes
// Get all classes attendance summary for admin dashboard
router.get('/admin/summary', authenticateToken, getAllClassesAttendanceSummary);

// Get detailed attendance report for admin with multiple classes
router.get('/admin/report', authenticateToken, getAdminAttendanceReport);

// Delete attendance record
router.delete('/:id', authenticateToken, deleteAttendanceRecord);

module.exports = router;