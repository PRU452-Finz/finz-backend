'use strict';

/**
 * User Routes
 * Base path: /api/users
 *
 * Protected by authMiddleware — user harus login.
 * User hanya bisa mengakses profil sendiri (authorization check di controller).
 */

const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const userController = require('../controllers/userController');

// Semua route memerlukan login
router.use(authMiddleware);

// Profile routes
router.get('/:id', userController.getUserProfile);
router.put('/:id', userController.updateUserProfile);

// Budget routes
router.get('/:id/budgets', userController.getUserBudgets);
router.post('/:id/budgets', userController.upsertUserBudget);
router.delete('/:id/budgets/:budgetId', userController.deleteUserBudget);

module.exports = router;
