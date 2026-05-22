'use strict';

const logger = require('../config/logger');

const User = require('../models/User');
const budgetService = require('../services/budgetService');

// ─────────────────────────────────────────────────────────────
// GET /api/users/:id
// ─────────────────────────────────────────────────────────────
const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan',
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    logger.error('[UserController.getUserProfile]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/users/:id
// ─────────────────────────────────────────────────────────────
const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, monthly_income, age, occupation, financial_goal, risk_profile } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan',
      });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (monthly_income !== undefined) user.monthly_income = monthly_income;
    if (age !== undefined) user.age = age;
    if (occupation) user.occupation = occupation;
    if (financial_goal) user.financial_goal = financial_goal;
    if (risk_profile) user.risk_profile = risk_profile;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profil berhasil diperbarui',
      data: user,
    });
  } catch (err) {
    logger.error('[UserController.updateUserProfile]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/users/:id/budgets
// ─────────────────────────────────────────────────────────────
const getUserBudgets = async (req, res) => {
  try {
    const { id } = req.params;
    const { month } = req.query; // Optional filter by month 'YYYY-MM'
    const data = await budgetService.getUserBudgets(id, month);

    return res.status(200).json({
      success: true,
      data: data,
    });
  } catch (err) {
    logger.error('[UserController.getUserBudgets]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/users/:id/budgets
// Body: { category, limit_amount, month }
// ─────────────────────────────────────────────────────────────
const upsertUserBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, limit_amount, month } = req.body;

    if (!category || limit_amount === undefined || !month) {
      return res.status(400).json({
        success: false,
        message: 'Category, limit_amount, dan month wajib diisi',
      });
    }

    const budget = await budgetService.upsertBudget(id, { category, limit_amount, month });

    return res.status(200).json({
      success: true,
      message: 'Budget berhasil disimpan',
      data: budget,
    });
  } catch (err) {
    logger.error('[UserController.upsertUserBudget]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
// ─────────────────────────────────────────────────────────────
// DELETE /api/users/:id/budgets/:budgetId
// ─────────────────────────────────────────────────────────────
const deleteUserBudget = async (req, res) => {
  try {
    const { id, budgetId } = req.params;
    const deleted = await budgetService.deleteBudget(id, budgetId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Budget tidak ditemukan.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Budget berhasil dihapus.',
    });
  } catch (err) {
    logger.error('[UserController.deleteUserBudget]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserBudgets,
  upsertUserBudget,
  deleteUserBudget,
};
