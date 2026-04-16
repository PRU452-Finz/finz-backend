'use strict';

/**
 * AI / Prediction Routes
 *
 * POST /api/predict/balance
 * POST /api/predict/category
 * GET  /api/recommendation/:user_id
 * GET  /api/financial-score/:user_id
 */

const express = require('express');
const router  = express.Router();

const aiController = require('../controllers/aiController');
const {
  predictBalanceRules,
  predictCategoryRules,
} = require('../middlewares/validators');

// Prediksi saldo akhir bulan
router.post('/predict/balance',    predictBalanceRules,   aiController.predictBalance);

// Klasifikasi kategori dari deskripsi
router.post('/predict/category',   predictCategoryRules,  aiController.predictCategory);

// Rekomendasi finansial per user
router.get('/recommendation/:user_id',  aiController.getRecommendations);

// Financial health score per user
router.get('/financial-score/:user_id', aiController.getFinancialScore);

module.exports = router;
