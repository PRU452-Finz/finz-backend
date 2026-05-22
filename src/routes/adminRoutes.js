'use strict';

const router = require('express').Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');

// Protected admin routes
router.get('/prediction-stats', authMiddleware, adminController.getPredictionStats);

module.exports = router;
