const express = require('express');
const router = express.Router();
const {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getTeacherClasses,
  assignTeacherToClass,
  unassignTeacherFromClass,
  getProfile,
  updateProfile
} = require('../controllers/teacherController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Get all teachers
router.get('/', authenticateToken, getAllTeachers);

// Get teacher by ID
router.get('/:id', authenticateToken, getTeacherById);

// Create new teacher
router.post('/', authenticateToken, authorizeRole(['ADMIN']), createTeacher);

// Update teacher
router.put('/:id', authenticateToken, authorizeRole(['ADMIN']), updateTeacher);

// Delete teacher
router.delete('/:id', authenticateToken, authorizeRole(['ADMIN']), deleteTeacher);

// Get teacher's classes
router.get('/:id/classes', authenticateToken, getTeacherClasses);

// Assign teacher to class
router.post('/:id/assign-class', authenticateToken, authorizeRole(['ADMIN']), assignTeacherToClass);

// Unassign teacher from class
router.post('/:id/unassign-class', authenticateToken, authorizeRole(['ADMIN']), unassignTeacherFromClass);

// Teacher profile management (for authenticated teacher)
router.get('/profile', authenticateToken, authorizeRole(['TEACHER']), getProfile);
router.put('/profile', authenticateToken, authorizeRole(['TEACHER']), updateProfile);

module.exports = router;