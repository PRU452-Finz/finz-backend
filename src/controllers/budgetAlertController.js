'use strict';

const logger = require('../config/logger');

/**
 * Budget Alert Controller
 *
 * Compares current month spending per category against budget limits.
 * Returns warning/exceeded status for each category.
 * Also fetches AI-powered alerts, generating them on-the-fly if needed.
 */

const { Op } = require('sequelize');
const { Transaction, Budget } = require('../models');
const aiService = require('../services/aiService');
const aiClient = require('../services/aiClient');

// ─────────────────────────────────────────────────────────────
// GET /api/budget-alert/:user_id
// Query: ?month=2026-04 (optional, defaults to current month)
// ─────────────────────────────────────────────────────────────
const getBudgetAlerts = async (req, res) => {
  try {
    const userId = req.params.user_id;
    const now = new Date();
    // Mendukung month dari params (sesuai API frontend) atau query
    const monthParam = req.params.month || req.query.month; 

    let year, month;
    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      [year, month] = monthParam.split('-').map(Number);
    } else {
      year  = now.getFullYear();
      month = now.getMonth() + 1;
    }

    const monthStr    = String(month).padStart(2, '0');
    const period      = `${year}-${monthStr}`; // Format 'YYYY-MM'
    const firstDay    = `${period}-01`;
    const lastDay     = new Date(year, month, 0).toISOString().slice(0, 10); // last day of month

    const [budgets, expenses, incomeResult] = await Promise.all([
      Budget.findAll({ where: { user_id: userId, month: period } }),
      Transaction.findAll({
        where: {
          user_id: userId,
          transaction_type: 'expense',
          date: { [Op.between]: [firstDay, lastDay] },
        },
      }),
      Transaction.sum('amount', {
        where: {
          user_id: userId,
          transaction_type: 'income',
          date: { [Op.between]: [firstDay, lastDay] },
        },
      }),
    ]);

    let totalSpending = 0;
    const categoryBreakdown = {};
    const spendingMap = {};
    for (const t of expenses) {
      const amount = parseFloat(t.amount);
      totalSpending += amount;
      spendingMap[t.category] = (spendingMap[t.category] || 0) + amount;
      const aiCatName = aiClient.BACKEND_TO_AI_CATEGORY[t.category] || t.category;
      categoryBreakdown[aiCatName] = (categoryBreakdown[aiCatName] || 0) + amount;
    }

    const totalIncome = parseFloat(incomeResult) || 0;
    const budgetMap = {};
    budgets.forEach(b => {
      const aiCatName = aiClient.BACKEND_TO_AI_CATEGORY[b.category] || b.category;
      budgetMap[aiCatName] = parseFloat(b.limit_amount);
    });

    // ── 1. Ambil AI-powered alerts (Rasio Income, Saldo Prediksi, dll) ──
    let aiAlerts = [];
    try {
      // Cek apakah AI API tersedia
      const aiAvailable = await aiClient.isAvailable();
      
      if (aiAvailable) {
        // Selalu generate ulang dari data terkini DB (hindari stale cache)
        logger.info(`[BudgetAlertController] Generating fresh alerts for user ${userId}...`);
        const initialBalance = req.user ? parseFloat(req.user.initial_balance) || 0 : 0;

        // Generate alerts via AI (overwrites old cache)
        await aiService.generateBudgetAlerts({
          user_id: userId,
          bulan: period,
          total_income: totalIncome,
          total_pengeluaran: totalSpending,
          saldo_awal: initialBalance,
          pengeluaran_per_kategori: categoryBreakdown,
          budgets: budgetMap,
        });

        // Ambil hasil fresh
        const aiResp = await aiService.getBudgetAlerts(userId, period);
        logger.info(`[BudgetAlertController] AI Response for user ${userId}:`, JSON.stringify(aiResp));
        const rules = aiResp?.alerts || aiResp?.triggered_rules || (Array.isArray(aiResp) ? aiResp : []);

        if (rules.length > 0) {
          aiAlerts = rules.map(r => ({
            category: 'AI Insight',
            message: r.message,
            status: r.severity === 'danger' ? 'exceeded' : 'warning',
            is_ai: true,
            is_read: r.is_read || false,
          }));
        }
      }
    } catch (err) {
      logger.warn('[BudgetAlertController] Gagal ambil AI alerts:', err.message);
    }

    if (budgets.length === 0 && aiAlerts.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          alerts: [],
          has_budget_set: false,
          period,
        },
      });
    }

    // ── 4. Compare spending vs budget limits ──────────────────
    const alerts = [...aiAlerts];

    for (const budget of budgets) {
      const limit = parseFloat(budget.limit_amount);
      const spent = spendingMap[budget.category] || 0;
      const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;

      let status = 'safe';
      if (percentage >= 100) {
        status = 'exceeded';
      } else if (percentage >= 80) {
        status = 'warning';
      }

      if (status !== 'safe') {
        alerts.push({
          category: budget.category,
          spent,
          limit,
          percentage,
          status,
        });
      }
    }

    // Sort: exceeded first, then warning, then by percentage desc. AI alerts handled separately
    alerts.sort((a, b) => {
      // Prioritaskan status 'exceeded'
      if (a.status !== b.status) {
        if (a.status === 'exceeded') return -1;
        if (b.status === 'exceeded') return 1;
        if (a.status === 'warning') return -1;
        if (b.status === 'warning') return 1;
      }
      
      // Jika status sama or fallback, gunakan percentage or 0
      const perA = a.percentage || 0;
      const perB = b.percentage || 0;
      return perB - perA;
    });

    return res.status(200).json({
      success: true,
      data: {
        alerts,
        has_budget_set: budgets.length > 0 || aiAlerts.length > 0,
        period,
      },
    });
  } catch (err) {
    logger.error('[BudgetAlertController.getBudgetAlerts]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getBudgetAlerts };
