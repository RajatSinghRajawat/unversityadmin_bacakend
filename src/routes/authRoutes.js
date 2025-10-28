const express = require('express');
const { register, login, logout, getadmin, getUniversityCodes } = require('../controllers/authController');
const router = express.Router();

// Simple routes without complex validation middleware
router.post('/register', register); 
router.post('/login', login);
router.post('/logout', logout);
router.get('/getadmin/:id', getadmin);
router.get('/university-codes', getUniversityCodes);

module.exports = router;