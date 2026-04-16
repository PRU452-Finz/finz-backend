'use strict';

/**
 * Transaction Routes
 * Base path: /api/transactions
 */

const express = require('express');
const router  = express.Router();

const transactionController = require('../controllers/transactionController');
const {
  createTransactionRules,
  updateTransactionRules,
} = require('../middlewares/validators');

// GET    /api/transactions         — list semua (+ filter)
router.get('/',        transactionController.index);

// GET    /api/transactions/:id     — detail satu
router.get('/:id',     transactionController.show);

// POST   /api/transactions         — buat baru
router.post('/',       createTransactionRules, transactionController.store);

// PUT    /api/transactions/:id     — update
router.put('/:id',     updateTransactionRules, transactionController.update);

// DELETE /api/transactions/:id     — hapus
router.delete('/:id',  transactionController.destroy);

module.exports = router;
