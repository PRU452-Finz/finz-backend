'use strict';

/**
 * User Controller
 *
 * Handles: get user profile, update user profile.
 */

const { User } = require('../models');

// ─────────────────────────────────────────────────────────────
// GET /api/users/:id
// ─────────────────────────────────────────────────────────────
const show = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan.',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        monthly_income: parseFloat(user.monthly_income),
        age: user.age,
        occupation: user.occupation,
        financial_goal: user.financial_goal,
        risk_profile: user.risk_profile,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error('[UserController.show]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/users/:id
// ─────────────────────────────────────────────────────────────
const update = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan.',
      });
    }

    const { name, monthly_income, age, occupation, financial_goal, risk_profile } = req.body;

    await user.update({
      name:           name           ?? user.name,
      monthly_income: monthly_income ?? user.monthly_income,
      age:            age            ?? user.age,
      occupation:     occupation     ?? user.occupation,
      financial_goal: financial_goal ?? user.financial_goal,
      risk_profile:   risk_profile   ?? user.risk_profile,
    });

    return res.status(200).json({
      success: true,
      message: 'Profil berhasil diupdate.',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        monthly_income: parseFloat(user.monthly_income),
        age: user.age,
        occupation: user.occupation,
        financial_goal: user.financial_goal,
        risk_profile: user.risk_profile,
      },
    });
  } catch (err) {
    console.error('[UserController.update]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { show, update };
