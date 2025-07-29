const express = require('express');
const router = express.Router();
const {
  getAllSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  deleteSchool,
  getSchoolStats
} = require('../controllers/schoolController');
const auth = require('../middleware/auth');

// Get all schools
router.get('/', auth, getAllSchools);

// Get school by ID
router.get('/:id', auth, getSchoolById);

// Create new school
router.post('/', auth, createSchool);

// Update school
router.put('/:id', auth, updateSchool);

// Delete school
router.delete('/:id', auth, deleteSchool);

// Get school statistics
router.get('/:id/stats', auth, getSchoolStats);

module.exports = router;