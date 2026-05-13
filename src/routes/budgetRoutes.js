'use strict';

const router = require('express').Router();
const budgetController = require('../controllers/budgetController');
const verifyToken       = require('../middlewares/verifyToken');

// All budget routes are protected
router.get('/:user_id',  verifyToken, budgetController.index);
router.post('/',          verifyToken, budgetController.createOrUpdate);
router.delete('/:id',     verifyToken, budgetController.destroy);

module.exports = router;
