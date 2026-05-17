'use strict';

const User = require('../models/User');
const Budget = require('../models/Budget');

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
    console.error('[UserController.getUserProfile]', err);
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
    console.error('[UserController.updateUserProfile]', err);
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

    const where = { user_id: id };
    if (month) {
      where.month = month;
    }

    const budgets = await Budget.findAll({ where });

    return res.status(200).json({
      success: true,
      data: budgets,
    });
  } catch (err) {
    console.error('[UserController.getUserBudgets]', err);
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

    // Cari apakah sudah ada budget untuk kategori dan bulan ini
    let budget = await Budget.findOne({
      where: {
        user_id: id,
        category,
        month,
      },
    });

    if (budget) {
      // Update
      budget.limit_amount = limit_amount;
      await budget.save();
    } else {
      // Create
      budget = await Budget.create({
        user_id: id,
        category,
        limit_amount,
        month,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Budget berhasil disimpan',
      data: budget,
    });
  } catch (err) {
    console.error('[UserController.upsertUserBudget]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserBudgets,
  upsertUserBudget,
};
