'use strict';

/**
 * Validators — express-validator rules
 *
 * Dipanggil sebagai middleware array sebelum controller handler.
 */

const { body } = require('express-validator');

// ─────────────────────────────────────────────────────────────
// Transaction Validators
// ─────────────────────────────────────────────────────────────

const VALID_CATEGORIES = [
  'makanan', 'transport', 'hiburan', 'belanja',
  'tagihan', 'pendidikan', 'kesehatan', 'lainnya',
];

const VALID_PAYMENT_METHODS = [
  'cash', 'debit', 'credit', 'ewallet', 'transfer', 'qris',
];

/**
 * Rules untuk CREATE transaksi — semua field wajib
 */
const createTransactionRules = [
  body('amount')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Amount harus berupa angka positif'),

  body('nominal')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Nominal harus berupa angka positif'),

  // Pastikan minimal salah satu ada
  body('amount').custom((value, { req }) => {
    if (!value && !req.body.nominal) {
      throw new Error('Amount / nominal wajib diisi');
    }
    return true;
  }),

  body('category')
    .notEmpty()
    .withMessage('Kategori wajib diisi')
    .isIn(VALID_CATEGORIES)
    .withMessage(`Kategori harus salah satu dari: ${VALID_CATEGORIES.join(', ')}`),

  body('description')
    .optional()
    .isString()
    .isLength({ max: 255 })
    .withMessage('Deskripsi maksimal 255 karakter'),

  body('payment_method')
    .optional()
    .isIn(VALID_PAYMENT_METHODS)
    .withMessage(`Metode pembayaran harus salah satu dari: ${VALID_PAYMENT_METHODS.join(', ')}`),

  body('date')
    .optional()
    .isDate()
    .withMessage('Format tanggal harus YYYY-MM-DD'),
];

/**
 * Rules untuk UPDATE transaksi — semua field opsional
 */
const updateTransactionRules = [
  body('amount')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Amount harus berupa angka positif'),

  body('nominal')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Nominal harus berupa angka positif'),

  body('category')
    .optional()
    .isIn(VALID_CATEGORIES)
    .withMessage(`Kategori harus salah satu dari: ${VALID_CATEGORIES.join(', ')}`),

  body('description')
    .optional()
    .isString()
    .isLength({ max: 255 })
    .withMessage('Deskripsi maksimal 255 karakter'),

  body('payment_method')
    .optional()
    .isIn(VALID_PAYMENT_METHODS)
    .withMessage(`Metode pembayaran harus salah satu dari: ${VALID_PAYMENT_METHODS.join(', ')}`),

  body('date')
    .optional()
    .isDate()
    .withMessage('Format tanggal harus YYYY-MM-DD'),
];

// ─────────────────────────────────────────────────────────────
// AI Validators
// ─────────────────────────────────────────────────────────────

const predictBalanceRules = [
  body('current_balance')
    .notEmpty()
    .withMessage('current_balance wajib diisi')
    .isFloat({ min: 0 })
    .withMessage('current_balance harus berupa angka non-negatif'),
];

const predictCategoryRules = [
  body('description')
    .notEmpty()
    .withMessage('description wajib diisi')
    .isString()
    .withMessage('description harus berupa string'),
];

module.exports = {
  createTransactionRules,
  updateTransactionRules,
  predictBalanceRules,
  predictCategoryRules,
};
