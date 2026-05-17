'use strict';

/**
 * AI Controller
 *
 * Menangani semua endpoint prediksi AI dan budget alert.
 * AI inference dilakukan via Flask AI API (dengan fallback ke mock).
 */

const { validationResult } = require('express-validator');
const aiService = require('../services/aiService');
const aiClient  = require('../services/aiClient');

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
        ai_powered: result.ai_powered || false,
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
const predictCategory = async (req, res) => {
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
    const result = await aiService.predictCategory(description);

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

// ─────────────────────────────────────────────────────────────
// POST /api/budget-alert/generate
// Body: { user_id, bulan, total_income, total_pengeluaran,
//         saldo_awal, pengeluaran_per_kategori, budgets? }
// ─────────────────────────────────────────────────────────────
const generateBudgetAlerts = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validasi gagal',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }

  try {
    const result = await aiService.generateBudgetAlerts(req.body);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('[AiController.generateBudgetAlerts]', err);

    // Cek apakah AI API yang down
    if (err.code === 'ECONNREFUSED' || err.code === 'ECONNABORTED') {
      return res.status(503).json({
        success: false,
        message: 'AI API tidak tersedia. Pastikan Flask AI API berjalan.',
        ai_api_url: aiClient.AI_BASE_URL,
      });
    }

    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/budget-alert/:user_id/:bulan
// ─────────────────────────────────────────────────────────────
const getBudgetAlerts = async (req, res) => {
  try {
    const { user_id, bulan } = req.params;
    const result = await aiService.getBudgetAlerts(user_id, bulan);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('[AiController.getBudgetAlerts]', err);

    if (err.code === 'ECONNREFUSED' || err.code === 'ECONNABORTED') {
      return res.status(503).json({
        success: false,
        message: 'AI API tidak tersedia.',
      });
    }

    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/budget-alert/:user_id/:bulan/read
// Body: { alert_id?: string } — tanpa alert_id = tandai semua
// ─────────────────────────────────────────────────────────────
const markAlertRead = async (req, res) => {
  try {
    const { user_id, bulan } = req.params;
    const { alert_id } = req.body || {};
    const result = await aiService.markAlertRead(user_id, bulan, alert_id);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('[AiController.markAlertRead]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/budget-alert/:user_id/history
// ─────────────────────────────────────────────────────────────
const getAlertHistory = async (req, res) => {
  try {
    const { user_id } = req.params;
    const result = await aiService.getAlertHistory(user_id);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('[AiController.getAlertHistory]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/ai/health
// ─────────────────────────────────────────────────────────────
const getAiHealth = async (req, res) => {
  try {
    const available = await aiClient.isAvailable();

    if (available) {
      const health = await aiClient.healthCheck();
      return res.status(200).json({
        success: true,
        data: {
          ai_api_status: 'connected',
          ai_api_url: aiClient.AI_BASE_URL,
          ...health,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ai_api_status: 'disconnected',
        ai_api_url: aiClient.AI_BASE_URL,
        message: 'AI API tidak tersedia. Endpoint prediksi akan menggunakan fallback (mock).',
      },
    });
  } catch (err) {
    console.error('[AiController.getAiHealth]', err);
    return res.status(200).json({
      success: true,
      data: {
        ai_api_status: 'error',
        ai_api_url: aiClient.AI_BASE_URL,
        error: err.message,
      },
    });
  }
};

module.exports = {
  predictBalance,
  predictCategory,
  getRecommendations,
  getFinancialScore,
  generateBudgetAlerts,
  getBudgetAlerts,
  markAlertRead,
  getAlertHistory,
  getAiHealth,
};
