'use strict';

/**
 * AI / Prediction Routes
 *
 * POST /api/predict/balance          — Prediksi saldo akhir bulan (AI + fallback)
 * POST /api/predict/category         — Klasifikasi kategori transaksi (AI + fallback)
 * GET  /api/recommendation/:user_id  — Rekomendasi finansial
 * GET  /api/financial-score/:user_id — Financial health score
 * GET  /api/ai/health                — Status koneksi AI API
 *
 * POST /api/budget-alert/generate               — Generate budget alerts (AI)
 * GET  /api/budget-alert/:user_id/:bulan         — Ambil alerts per bulan
 * POST /api/budget-alert/:user_id/:bulan/read    — Tandai alert dibaca
 * GET  /api/budget-alert/:user_id/history        — Riwayat alert
 *
 * Semua route (kecuali AI health) di-protect oleh authMiddleware.
 */

const express = require('express');
const router  = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const aiController = require('../controllers/aiController');
const {
  predictBalanceRules,
  predictCategoryRules,
  generateBudgetAlertRules,
} = require('../middlewares/validators');

// ── AI Health Check (public — untuk monitoring) ─────────────
router.get('/ai/health', aiController.getAiHealth);

// ── Semua route di bawah ini memerlukan login ────────────────
router.use(authMiddleware);

// ── Prediksi ─────────────────────────────────────────────────
router.post('/predict/balance',    predictBalanceRules,   aiController.predictBalance);
router.post('/predict/category',   predictCategoryRules,  aiController.predictCategory);

// ── Rekomendasi & Score ──────────────────────────────────────
router.get('/recommendation/:user_id',  aiController.getRecommendations);
router.get('/financial-score/:user_id', aiController.getFinancialScore);

// ── Budget Alert (AI-powered) ────────────────────────────────
router.post('/budget-alert/generate',               generateBudgetAlertRules, aiController.generateBudgetAlerts);
router.get( '/budget-alert/:user_id/:bulan',         aiController.getBudgetAlerts);
router.post('/budget-alert/:user_id/:bulan/read',    aiController.markAlertRead);
router.get( '/budget-alert/:user_id/history',        aiController.getAlertHistory);

module.exports = router;
