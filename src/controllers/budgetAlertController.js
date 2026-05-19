'use strict';

/**
 * Budget Alert Controller
 *
 * Compares current month spending per category against budget limits.
 * Returns warning/exceeded status for each category.
 */

const { Op, fn, col } = require('sequelize');
const { Transaction, Budget } = require('../models');
const aiService = require('../services/aiService');

// ─────────────────────────────────────────────────────────────
// GET /api/budget-alert/:user_id
// Query: ?month=2026-04 (optional, defaults to current month)
// ─────────────────────────────────────────────────────────────
const getBudgetAlerts = async (req, res) => {
  try {
    const userId = parseInt(req.params.user_id);
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

    // ── 1. Ambil AI-powered alerts (Rasio Income, Saldo Prediksi, dll) ──
    let aiAlerts = [];
    try {
      const aiResp = await aiService.getBudgetAlerts(userId, period);
      console.log(`[BudgetAlertController] AI Response for user ${userId}:`, JSON.stringify(aiResp));
      
      const rules = aiResp?.alerts || aiResp?.triggered_rules || (Array.isArray(aiResp) ? aiResp : []);
      
      if (rules.length > 0) {
        aiAlerts = rules.map(r => ({
          category: 'AI Insight',
          message: r.message,
          status: r.severity === 'danger' ? 'exceeded' : 'warning',
          is_ai: true
        }));
      }
    } catch (err) {
      console.warn('[BudgetAlertController] Gagal ambil AI alerts:', err.message);
    }

    // ── 2. Get budgets for this month (Standard Logic) ─────────
    const budgets = await Budget.findAll({
      where: { user_id: userId, month: period },
    });

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

    // ── 3. Get spending per category (Standard Logic) ──────────
    const spendingRows = await Transaction.findAll({
      attributes: [
        'category',
        [fn('SUM', col('amount')), 'total_spent'],
      ],
      where: {
        user_id: userId,
        transaction_type: 'expense',
        date: { [Op.between]: [firstDay, lastDay] },
      },
      group: ['category'],
      raw: true,
    });

    const spendingMap = {};
    for (const row of spendingRows) {
      spendingMap[row.category] = parseFloat(row.total_spent);
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
    console.error('[BudgetAlertController.getBudgetAlerts]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getBudgetAlerts };
