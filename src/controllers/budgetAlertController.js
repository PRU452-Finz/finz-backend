'use strict';

/**
 * Budget Alert Controller
 *
 * Compares current month spending per category against budget limits.
 * Returns warning/exceeded status for each category.
 */

const { Op, fn, col } = require('sequelize');
const { Transaction, Budget } = require('../models');

// ─────────────────────────────────────────────────────────────
// GET /api/budget-alert/:user_id
// Query: ?month=2026-04 (optional, defaults to current month)
// ─────────────────────────────────────────────────────────────
const getBudgetAlerts = async (req, res) => {
  try {
    const userId = parseInt(req.params.user_id);
    const now = new Date();
    const monthParam = req.query.month; // format: YYYY-MM

    let year, month;
    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      [year, month] = monthParam.split('-').map(Number);
    } else {
      year  = now.getFullYear();
      month = now.getMonth() + 1;
    }

    const monthStr    = String(month).padStart(2, '0');
    const period      = `${year}-${monthStr}`;
    const monthDate   = `${period}-01`;
    const firstDay    = `${period}-01`;
    const lastDay     = new Date(year, month, 0).toISOString().slice(0, 10); // last day of month

    // ── 1. Get budgets for this month ─────────────────────────
    const budgets = await Budget.findAll({
      where: { user_id: userId, month: monthDate },
    });

    if (budgets.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          alerts: [],
          has_budget_set: false,
          period,
        },
      });
    }

    // ── 2. Get spending per category (expenses only) ──────────
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

    // Build spending map: { makanan: 450000, transport: 120000, ... }
    const spendingMap = {};
    for (const row of spendingRows) {
      spendingMap[row.category] = parseFloat(row.total_spent);
    }

    // ── 3. Compare spending vs budget limits ──────────────────
    const alerts = [];

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

      // Only include categories that are warning or exceeded
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

    // Sort: exceeded first, then warning, then by percentage desc
    alerts.sort((a, b) => {
      if (a.status === b.status) return b.percentage - a.percentage;
      if (a.status === 'exceeded') return -1;
      return 1;
    });

    return res.status(200).json({
      success: true,
      data: {
        alerts,
        has_budget_set: true,
        period,
      },
    });
  } catch (err) {
    console.error('[BudgetAlertController.getBudgetAlerts]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getBudgetAlerts };
