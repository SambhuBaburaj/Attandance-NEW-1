const express = require('express');
const router = express.Router();
const {
  getAttendanceByClassAndDate,
  markAttendance,
  getAttendanceHistory,
  getAttendanceStats,
  getDetailedAttendanceByDate,
  deleteAttendanceRecord
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

// Delete attendance record
router.delete('/:id', authenticateToken, deleteAttendanceRecord);

module.exports = router;