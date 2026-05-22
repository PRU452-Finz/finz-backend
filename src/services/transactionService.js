'use strict';

/**
 * Transaction Service
 *
 * Lapisan business logic untuk manajemen transaksi.
 * Controller hanya memanggil service ini — tidak boleh ada logika di controller.
 */

const { Op } = require('sequelize');
const Transaction = require('../models/Transaction');
const cacheService = require('./cacheService');

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
const getAllTransactions = async ({
  user_id,
  category,
  date_from,
  date_to,
  page = 1,
  limit = 20,
} = {}) => {
  const where = { user_id };
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const offset = (safePage - 1) * safeLimit;

  if (category && category !== 'all') {
    where.category = category;
  }

  if (date_from || date_to) {
    where.date = {};
    if (date_from) where.date[Op.gte] = date_from;
    if (date_to)   where.date[Op.lte] = date_to;
  }

  const { rows, count } = await Transaction.findAndCountAll({
    where,
    order: [['date', 'DESC'], ['created_at', 'DESC']],
    limit: safeLimit,
    offset,
  });

  return {
    data: rows.map(formatTransaction),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: count,
      totalPages: Math.ceil(count / safeLimit),
    },
  };
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
    user_id: data.user_id,
    amount: data.amount ?? data.nominal,
    category: data.category,
    description: data.description || '',
    payment_method: data.payment_method || 'cash',
    transaction_type: data.transaction_type || 'expense',
    date: data.date || new Date().toISOString().slice(0, 10),
    created_at: new Date(),
  });

  await cacheService.delPattern(`finz:cache:*:${t.user_id}*`);

  return formatTransaction(t);
};

/**
 * Update transaksi
 */
const updateTransaction = async (id, data) => {
  const t = await Transaction.findByPk(id);
  if (!t) return null;
  const userId = t.user_id;

  await t.update({
    amount:           data.amount ?? data.nominal ?? t.amount,
    category:         data.category         ?? t.category,
    description:      data.description      ?? t.description,
    payment_method:   data.payment_method   ?? t.payment_method,
    transaction_type: data.transaction_type  ?? t.transaction_type,
    date:             data.date             ?? t.date,
  });

  await cacheService.delPattern(`finz:cache:*:${userId}*`);

  return formatTransaction(t);
};

/**
 * Hapus transaksi
 */
const deleteTransaction = async (id) => {
  const t = await Transaction.findByPk(id);
  if (!t) return false;
  const userId = t.user_id;
  await t.destroy();
  await cacheService.delPattern(`finz:cache:*:${userId}*`);
  return true;
};

module.exports = {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
};
