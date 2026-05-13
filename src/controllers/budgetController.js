'use strict';

/**
 * Budget Controller
 *
 * Handles: list budgets for current month, create/update budget, delete budget.
 */

const { Op }   = require('sequelize');
const { Budget } = require('../models');

// ─────────────────────────────────────────────────────────────
// GET /api/budgets/:user_id
// Query: ?month=2026-04 (optional, defaults to current month)
// ─────────────────────────────────────────────────────────────
const index = async (req, res) => {
  try {
    const userId = parseInt(req.params.user_id);

    // Determine target month
    const now = new Date();
    const monthParam = req.query.month; // format: YYYY-MM
    let monthDate;

    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      monthDate = `${monthParam}-01`;
    } else {
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      monthDate = `${y}-${m}-01`;
    }

    const budgets = await Budget.findAll({
      where: { user_id: userId, month: monthDate },
      order: [['category', 'ASC']],
    });

    return res.status(200).json({
      success: true,
      data: budgets.map((b) => ({
        id: b.id,
        user_id: b.user_id,
        category: b.category,
        limit_amount: parseFloat(b.limit_amount),
        month: b.month,
        created_at: b.created_at,
      })),
      period: monthDate.slice(0, 7), // YYYY-MM
    });
  } catch (err) {
    console.error('[BudgetController.index]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/budgets
// Body: { user_id, category, limit_amount, month? }
// Upsert: jika budget untuk user+category+month sudah ada → update
// ─────────────────────────────────────────────────────────────
const createOrUpdate = async (req, res) => {
  try {
    const { user_id, category, limit_amount, month } = req.body;

    if (!user_id || !category || limit_amount === undefined) {
      return res.status(422).json({
        success: false,
        message: 'user_id, category, dan limit_amount wajib diisi.',
      });
    }

    // Determine month
    let monthDate;
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      monthDate = `${month}-01`;
    } else if (month && /^\d{4}-\d{2}-\d{2}$/.test(month)) {
      monthDate = month;
    } else {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      monthDate = `${y}-${m}-01`;
    }

    // Try to find existing budget
    let budget = await Budget.findOne({
      where: { user_id, category, month: monthDate },
    });

    if (budget) {
      // Update existing
      await budget.update({ limit_amount });

      return res.status(200).json({
        success: true,
        message: `Budget kategori "${category}" berhasil diupdate.`,
        data: {
          id: budget.id,
          user_id: budget.user_id,
          category: budget.category,
          limit_amount: parseFloat(budget.limit_amount),
          month: budget.month,
        },
      });
    }

    // Create new
    budget = await Budget.create({
      user_id,
      category,
      limit_amount,
      month: monthDate,
    });

    return res.status(201).json({
      success: true,
      message: `Budget kategori "${category}" berhasil dibuat.`,
      data: {
        id: budget.id,
        user_id: budget.user_id,
        category: budget.category,
        limit_amount: parseFloat(budget.limit_amount),
        month: budget.month,
      },
    });
  } catch (err) {
    console.error('[BudgetController.createOrUpdate]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE /api/budgets/:id
// ─────────────────────────────────────────────────────────────
const destroy = async (req, res) => {
  try {
    const budget = await Budget.findByPk(req.params.id);

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget tidak ditemukan.',
      });
    }

    await budget.destroy();

    return res.status(200).json({
      success: true,
      message: 'Budget berhasil dihapus.',
    });
  } catch (err) {
    console.error('[BudgetController.destroy]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { index, createOrUpdate, destroy };
