'use strict';

const router = require('express').Router();
const budgetAlertController = require('../controllers/budgetAlertController');
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middlewares/authMiddleware');
const { generateBudgetAlertRules } = require('../middlewares/validators');

// All routes require auth
router.use(authMiddleware);

// Budget alert routes — order matters!
// More specific routes must come before parameterized ones.
router.post('/generate', generateBudgetAlertRules, aiController.generateBudgetAlerts);
router.get('/:user_id/history', aiController.getAlertHistory);
router.post('/:user_id/:bulan/read', aiController.markAlertRead);
router.get('/:user_id/:month?', budgetAlertController.getBudgetAlerts);

module.exports = router;
