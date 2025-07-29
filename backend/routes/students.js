const express = require('express');
const router = express.Router();
const {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getAvailableParents,
  getStudentsByClass
} = require('../controllers/studentController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, getAllStudents);
router.get('/parents', authenticateToken, getAvailableParents);
router.get('/class/:classId', authenticateToken, getStudentsByClass);
router.get('/:id', authenticateToken, getStudentById);
router.post('/', authenticateToken, createStudent);
router.put('/:id', authenticateToken, updateStudent);
router.delete('/:id', authenticateToken, deleteStudent);

module.exports = router;