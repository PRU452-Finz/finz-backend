'use strict';

const router = require('express').Router();
const budgetController = require('../controllers/budgetController');
const authMiddleware = require('../middlewares/authMiddleware');

// All budget routes are protected
router.get('/:user_id', authMiddleware, budgetController.index);
router.post('/', authMiddleware, budgetController.createOrUpdate);
router.delete('/:id', authMiddleware, budgetController.destroy);

module.exports = router;
