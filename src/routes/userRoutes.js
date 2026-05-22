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
const ownershipCheck = require('../middlewares/ownershipCheck');
const userController = require('../controllers/userController');

// Semua route memerlukan login
router.use(authMiddleware);

// Profile routes
router.get('/:id', ownershipCheck, userController.getUserProfile);
router.put('/:id', ownershipCheck, userController.updateUserProfile);

// Budget routes
router.get('/:id/budgets', ownershipCheck, userController.getUserBudgets);
router.post('/:id/budgets', ownershipCheck, userController.upsertUserBudget);
router.delete('/:id/budgets/:budgetId', ownershipCheck, userController.deleteUserBudget);

module.exports = router;
