'use strict';

/**
 * Dashboard Routes
 * Base path: /api/dashboard
 *
 * Protected by authMiddleware — user harus login.
 */

const express = require('express');
const router  = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const dashboardController = require('../controllers/dashboardController');

// Semua route memerlukan login
router.use(authMiddleware);

// GET /api/dashboard
router.get('/', dashboardController.getDashboard);

module.exports = router;
