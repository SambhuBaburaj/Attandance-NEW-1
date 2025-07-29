const express = require('express');
const router = express.Router();
const {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  getAvailableTeachers
} = require('../controllers/classController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, getAllClasses);
router.get('/teachers', authenticateToken, getAvailableTeachers);
router.get('/:id', authenticateToken, getClassById);
router.post('/', authenticateToken, createClass);
router.put('/:id', authenticateToken, updateClass);
router.delete('/:id', authenticateToken, deleteClass);

module.exports = router;