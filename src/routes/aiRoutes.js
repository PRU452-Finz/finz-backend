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
 * Budget Alert routes → see budgetAlertRoutes.js
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

// ── Budget Alert routes are handled by budgetAlertRoutes.js ──
// See: /api/budget-alert/* in budgetAlertRoutes.js

module.exports = router;
