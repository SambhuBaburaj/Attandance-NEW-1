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
  unassignTeacherFromClass
} = require('../controllers/teacherController');
const auth = require('../middleware/auth');

// Get all teachers
router.get('/', auth, getAllTeachers);

// Get teacher by ID
router.get('/:id', auth, getTeacherById);

// Create new teacher
router.post('/', auth, createTeacher);

// Update teacher
router.put('/:id', auth, updateTeacher);

// Delete teacher
router.delete('/:id', auth, deleteTeacher);

// Get teacher's classes
router.get('/:id/classes', auth, getTeacherClasses);

// Assign teacher to class
router.post('/:id/assign-class', auth, assignTeacherToClass);

// Unassign teacher from class
router.post('/:id/unassign-class', auth, unassignTeacherFromClass);

module.exports = router;