'use strict';

const logger = require('../config/logger');

/**
 * Transaction Controller
 *
 * Bertanggung jawab hanya pada:
 *   - Membaca request (params, query, body)
 *   - Memanggil service
 *   - Mengirim response HTTP
 *
 * Tidak ada business logic di sini.
 */

const { validationResult } = require('express-validator');
const transactionService   = require('../services/transactionService');

// ─────────────────────────────────────────────────────────────
// Helper: kirim validation errors
// ─────────────────────────────────────────────────────────────
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validasi gagal',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  return null;
};

// ─────────────────────────────────────────────────────────────
// GET /api/transactions
// Query: ?category=makanan&date_from=2026-04-01&date_to=2026-04-30
// ─────────────────────────────────────────────────────────────
const index = async (req, res) => {
  try {
    const { category, date_from, date_to } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const user_id = req.user.id;

    const result = await transactionService.getAllTransactions({
      user_id,
      category,
      date_from,
      date_to,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      count: result.data.length,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (err) {
    logger.error('[TransactionController.index]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/transactions/:id
// ─────────────────────────────────────────────────────────────
const show = async (req, res) => {
  try {
    const transaction = await transactionService.getTransactionById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
    }

    return res.status(200).json({ success: true, data: transaction });
  } catch (err) {
    logger.error('[TransactionController.show]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/transactions
// ─────────────────────────────────────────────────────────────
const store = async (req, res) => {
  const validErr = handleValidationErrors(req, res);
  if (validErr) return;

  try {
    const transaction = await transactionService.createTransaction({
      ...req.body,
      user_id: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: 'Transaksi berhasil ditambahkan',
      data: transaction,
    });
  } catch (err) {
    logger.error('[TransactionController.store]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/transactions/:id
// ─────────────────────────────────────────────────────────────
const update = async (req, res) => {
  const validErr = handleValidationErrors(req, res);
  if (validErr) return;

  try {
    const transaction = await transactionService.updateTransaction(req.params.id, req.body);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
    }

    return res.status(200).json({
      success: true,
      message: 'Transaksi berhasil diupdate',
      data: transaction,
    });
  } catch (err) {
    logger.error('[TransactionController.update]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/transactions/:id
// ─────────────────────────────────────────────────────────────
const destroy = async (req, res) => {
  try {
    const deleted = await transactionService.deleteTransaction(req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
    }

    return res.status(200).json({ success: true, message: 'Transaksi berhasil dihapus' });
  } catch (err) {
    logger.error('[TransactionController.destroy]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { index, show, store, update, destroy };
