'use strict';

/**
 * AI Controller
 *
 * Menangani semua endpoint prediksi dan rekomendasi AI (mock).
 */

const { validationResult } = require('express-validator');
const aiService = require('../services/aiService');

// ─────────────────────────────────────────────────────────────
// POST /api/predict/balance
// Body: { current_balance: number, user_id?: number }
// ─────────────────────────────────────────────────────────────
const predictBalance = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validasi gagal',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  try {
    const { current_balance, user_id = 1 } = req.body;
    const result = await aiService.predictBalance({ current_balance, user_id });

    return res.status(200).json({
      success: true,
      data: {
        predicted_balance: result.predicted_balance,
        status: result.status,
        message: result.message,
        detail: {
          current_balance: result.current_balance,
          spent_so_far: result.spent_so_far,
          avg_per_day: Math.round(result.avg_per_day),
          days_remaining: result.days_remaining,
        },
      },
    });
  } catch (err) {
    console.error('[AiController.predictBalance]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/predict/category
// Body: { description: string }
// ─────────────────────────────────────────────────────────────
const predictCategory = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validasi gagal',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  try {
    const { description } = req.body;
    const result = aiService.predictCategory(description);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('[AiController.predictCategory]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/recommendation/:user_id
// ─────────────────────────────────────────────────────────────
const getRecommendations = async (req, res) => {
  try {
    const user_id = parseInt(req.params.user_id, 10) || 1;
    const recommendations = await aiService.getRecommendations(user_id);

    return res.status(200).json({
      success: true,
      count: recommendations.length,
      data: recommendations,
    });
  } catch (err) {
    console.error('[AiController.getRecommendations]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/financial-score/:user_id
// ─────────────────────────────────────────────────────────────
const getFinancialScore = async (req, res) => {
  try {
    const user_id = parseInt(req.params.user_id, 10) || 1;
    const result = await aiService.getFinancialScore(user_id);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('[AiController.getFinancialScore]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  predictBalance,
  predictCategory,
  getRecommendations,
  getFinancialScore,
};
