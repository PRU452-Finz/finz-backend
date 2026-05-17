'use strict';

/**
 * Transaction Service
 *
 * Lapisan business logic untuk manajemen transaksi.
 * Controller hanya memanggil service ini — tidak boleh ada logika di controller.
 */

const { Op } = require('sequelize');
const Transaction = require('../models/Transaction');

// ═══════════ Helpers ═══════════

/**
 * Membuat objek response transaksi yang konsisten untuk frontend FinZ.
 * Frontend menggunakan `nominal` bukan `amount`.
 */
const formatTransaction = (t) => ({
  id: t.id,
  user_id: t.user_id,
  nominal: parseFloat(t.amount),   // alias untuk kompat frontend
  amount: parseFloat(t.amount),
  category: t.category,
  description: t.description,
  payment_method: t.payment_method,
  transaction_type: t.transaction_type,
  date: t.date,
  created_at: t.created_at,
});

// ═══════════ CRUD Services ═══════════

/**
 * Ambil semua transaksi dengan filter opsional (kategori & tanggal)
 */
const getAllTransactions = async ({ user_id = 1, category, date_from, date_to } = {}) => {
  const where = { user_id };

  if (category && category !== 'all') {
    where.category = category;
  }

  if (date_from || date_to) {
    where.date = {};
    if (date_from) where.date[Op.gte] = date_from;
    if (date_to)   where.date[Op.lte] = date_to;
  }

  const rows = await Transaction.findAll({
    where,
    order: [['date', 'DESC'], ['created_at', 'DESC']],
  });

  return rows.map(formatTransaction);
};

/**
 * Ambil satu transaksi by ID
 */
const getTransactionById = async (id) => {
  const t = await Transaction.findByPk(id);
  if (!t) return null;
  return formatTransaction(t);
};

/**
 * Buat transaksi baru
 */
const createTransaction = async (data) => {
  const t = await Transaction.create({
    user_id: data.user_id || 1,
    amount: data.amount ?? data.nominal,
    category: data.category,
    description: data.description || '',
    payment_method: data.payment_method || 'cash',
    transaction_type: data.transaction_type || 'expense',
    date: data.date || new Date().toISOString().slice(0, 10),
    created_at: new Date(),
  });

  return formatTransaction(t);
};

/**
 * Update transaksi
 */
const updateTransaction = async (id, data) => {
  const t = await Transaction.findByPk(id);
  if (!t) return null;

  await t.update({
    amount:           data.amount ?? data.nominal ?? t.amount,
    category:         data.category         ?? t.category,
    description:      data.description      ?? t.description,
    payment_method:   data.payment_method   ?? t.payment_method,
    transaction_type: data.transaction_type  ?? t.transaction_type,
    date:             data.date             ?? t.date,
  });

  return formatTransaction(t);
};

/**
 * Hapus transaksi
 */
const deleteTransaction = async (id) => {
  const t = await Transaction.findByPk(id);
  if (!t) return false;
  await t.destroy();
  return true;
};

module.exports = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
