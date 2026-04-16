'use strict';

/**
 * Dashboard Routes
 * Base path: /api/dashboard
 */

const express = require('express');
const router  = express.Router();

const dashboardController = require('../controllers/dashboardController');

// GET /api/dashboard
router.get('/', dashboardController.getDashboard);

module.exports = router;
