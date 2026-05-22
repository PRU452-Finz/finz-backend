'use strict';

const logger = require('../config/logger');

/**
 * Dashboard Service
 *
 * Menghitung ringkasan keuangan bulan ini untuk endpoint GET /api/dashboard.
 * Logika agregasi ada di sini, bukan di controller.
 */

const { Op } = require('sequelize');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const aiService = require('./aiService');
const aiClient = require('./aiClient'); // Import aiClient untuk mapping kategori
const cacheService = require('./cacheService');
const { Budget } = require('../models');

/**
 * Ambil ringkasan dashboard bulan berjalan
 * @param {string} user_id
 */
const getDashboardSummary = async (user_id) => {
  const cacheKey = cacheService.keys.dashboard(user_id);
  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
  const firstDay = `${currentMonth}-01`;
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  // ─── 0. Saldo Awal User ────────────────────────────────────
  const user = await User.findByPk(user_id, { attributes: ['initial_balance'] });
  const initialBalance = user ? parseFloat(user.initial_balance) || 0 : 0;

  // ─── 1. Semua transaksi bulan ini ───────────────────────────
  const thisMonthTxns = await Transaction.findAll({
    where: {
      user_id,
      date: { [Op.between]: [firstDay, lastDay] },
    },
    order: [['date', 'ASC']],
  });

  // ─── 2. Total pengeluaran & pemasukan ─────────────────────────
  let totalSpending = 0;
  let totalIncome = 0;

  for (const t of thisMonthTxns) {
    const amount = parseFloat(t.amount);
    if (t.transaction_type === 'income') {
      totalIncome += amount;
    } else {
      totalSpending += amount;
    }
  }

  // ─── 3. Group by kategori (Hanya Pengeluaran) ─────────────────
  const categoryBreakdown = {};
  for (const t of thisMonthTxns) {
    if (t.transaction_type === 'income') continue;
    const cat = t.category;
    categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + parseFloat(t.amount);
  }

  // ─── Trigger AI Budget Alerts (Background) ────────────────────
  (async () => {
    try {
      const userBudgets = await Budget.findAll({ where: { user_id, month: currentMonth } });
      const budgetMap = {};
      userBudgets.forEach(b => {
        // Konversi kategori backend ke format yang dimengerti AI (Formal Indonesia) menggunakan aiClient
        const aiCatName = aiClient.BACKEND_TO_AI_CATEGORY[b.category] || b.category;
        budgetMap[aiCatName] = parseFloat(b.limit_amount);
      });

      // Konversi pengeluaran per kategori juga
      const aiSpendingMap = {};
      for (const [cat, amt] of Object.entries(categoryBreakdown)) {
        const aiCatName = aiClient.BACKEND_TO_AI_CATEGORY[cat] || cat;
        aiSpendingMap[aiCatName] = amt;
      }

      await aiService.generateBudgetAlerts({
        user_id,
        bulan: currentMonth,
        total_income: totalIncome,
        total_pengeluaran: totalSpending,
        saldo_awal: initialBalance,
        pengeluaran_per_kategori: aiSpendingMap,
        budgets: budgetMap
      });
    } catch (err) {
      logger.warn('[DashboardService] Gagal generate AI alerts:', err.message);
    }
  })();

  // ─── 4. Daily breakdown (Hanya Pengeluaran) ───────────────────
  const dailyBreakdown = {};
  for (const t of thisMonthTxns) {
    if (t.transaction_type === 'income') continue;
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
    if (t.transaction_type === 'income') continue; // Hanya pengeluaran untuk bar chart
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyBreakdown[key] = (monthlyBreakdown[key] || 0) + parseFloat(t.amount);
  }

  // ─── 6. Avg daily ──────────────────────────────────────────
  const uniqueDays = Object.keys(dailyBreakdown).length;
  const avgDaily = uniqueDays > 0 ? totalSpending / uniqueDays : 0;

  const result = {
    total_spending: totalSpending,
    total_income: totalIncome,
    transaction_count: thisMonthTxns.length,
    avg_daily: avgDaily,
    category_breakdown: categoryBreakdown,
    daily_breakdown: dailyBreakdown,
    monthly_breakdown: monthlyBreakdown,
    period: { from: firstDay, to: lastDay },
  };

  await cacheService.set(cacheKey, result, cacheService.TTL.DASHBOARD);

  return result;
};

module.exports = { getDashboardSummary };
