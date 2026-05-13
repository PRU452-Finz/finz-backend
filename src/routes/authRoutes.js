'use strict';

const router = require('express').Router();
const authController = require('../controllers/authController');
const verifyToken     = require('../middlewares/verifyToken');

// Public routes
router.post('/register', authController.register);
router.post('/login',    authController.login);

// Protected route
router.get('/me', verifyToken, authController.me);

module.exports = router;
