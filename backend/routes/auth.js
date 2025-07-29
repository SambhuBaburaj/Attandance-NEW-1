const express = require('express');
const { login, createUser, adminSignup, changePassword } = require('../controllers/authController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.post('/admin-signup', adminSignup);
router.post('/create-user', authenticateToken, authorizeRole(['ADMIN']), createUser);
router.post('/change-password', authenticateToken, changePassword);

module.exports = router;