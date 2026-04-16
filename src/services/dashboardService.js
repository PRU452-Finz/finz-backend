'use strict';

/**
 * Dashboard Service
 *
 * Menghitung ringkasan keuangan bulan ini untuk endpoint GET /api/dashboard.
 * Logika agregasi ada di sini, bukan di controller.
 */

const { Op, fn, col, literal } = require('sequelize');
const sequelize = require('../config/database');
const Transaction = require('../models/Transaction');

/**
 * Ambil ringkasan dashboard bulan berjalan
 * @param {number} user_id
 */
const getDashboardSummary = async (user_id = 1) => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  // ─── 1. Semua transaksi bulan ini ───────────────────────────
  const thisMonthTxns = await Transaction.findAll({
    where: {
      user_id,
      date: { [Op.between]: [firstDay, lastDay] },
    },
    order: [['date', 'ASC']],
  });

  // ─── 2. Total pengeluaran ────────────────────────────────────
  const totalSpending = thisMonthTxns.reduce(
    (sum, t) => sum + parseFloat(t.amount),
    0
  );

  // ─── 3. Group by kategori ────────────────────────────────────
  const categoryBreakdown = {};
  for (const t of thisMonthTxns) {
    const cat = t.category;
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + parseFloat(t.amount);
  }

  // ─── 4. Daily breakdown ──────────────────────────────────────
  const dailyBreakdown = {};
  for (const t of thisMonthTxns) {
    const key = t.date;
    dailyBreakdown[key] = (dailyBreakdown[key] || 0) + parseFloat(t.amount);
  }

  // ─── 5. Monthly breakdown (semua bulan, 6 bulan ke belakang) ─
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    .toISOString()
    .slice(0, 10);

  const allRecentTxns = await Transaction.findAll({
    where: {
      user_id,
      date: { [Op.gte]: sixMonthsAgo },
    },
  });

  const monthlyBreakdown = {};
  for (const t of allRecentTxns) {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyBreakdown[key] = (monthlyBreakdown[key] || 0) + parseFloat(t.amount);
  }

  // ─── 6. Avg daily ──────────────────────────────────────────
  const uniqueDays = Object.keys(dailyBreakdown).length;
  const avgDaily = uniqueDays > 0 ? totalSpending / uniqueDays : 0;

  return {
    total_spending: totalSpending,
    transaction_count: thisMonthTxns.length,
    avg_daily: avgDaily,
    category_breakdown: categoryBreakdown,
    daily_breakdown: dailyBreakdown,
    monthly_breakdown: monthlyBreakdown,
    period: { from: firstDay, to: lastDay },
  };
};

module.exports = { getDashboardSummary };
