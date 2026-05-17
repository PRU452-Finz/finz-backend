'use strict';

const router = require('express').Router();
const adminController = require('../controllers/adminController');
const verifyToken      = require('../middlewares/verifyToken');

// Protected admin routes
router.get('/prediction-stats', verifyToken, adminController.getPredictionStats);

module.exports = router;
