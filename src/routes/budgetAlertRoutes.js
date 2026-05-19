'use strict';

const router = require('express').Router();
const budgetAlertController = require('../controllers/budgetAlertController');
const verifyToken            = require('../middlewares/verifyToken');

// Protected route
router.get('/:user_id/:month?', verifyToken, budgetAlertController.getBudgetAlerts);

module.exports = router;
