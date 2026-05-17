'use strict';

/**
 * Admin Controller
 *
 * Handles: prediction stats from prediction_logs table.
 */

const { fn, col, literal } = require('sequelize');
const { PredictionLog } = require('../models');

// ─────────────────────────────────────────────────────────────
// GET /api/admin/prediction-stats
// ─────────────────────────────────────────────────────────────
const getPredictionStats = async (req, res) => {
  try {
    // ── 1. Total predictions ──────────────────────────────────
    const totalPredictions = await PredictionLog.count();

    if (totalPredictions === 0) {
      return res.status(200).json({
        success: true,
        data: {
          total_predictions: 0,
          accuracy_rate: 0,
          overridden_count: 0,
          override_rate: 0,
          top_categories: [],
          avg_confidence: 0,
        },
        message: 'Belum ada data prediksi.',
      });
    }

    // ── 2. Overridden count ───────────────────────────────────
    const overriddenCount = await PredictionLog.count({
      where: { user_overridden: true },
    });

    // ── 3. Accuracy rate ──────────────────────────────────────
    // Prediksi dianggap akurat jika user TIDAK meng-override
    const accuracyRate = Math.round(
      ((totalPredictions - overriddenCount) / totalPredictions) * 100
    );

    // ── 4. Top predicted categories ───────────────────────────
    const topCategories = await PredictionLog.findAll({
      attributes: [
        'predicted_category',
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['predicted_category'],
      order: [[literal('count'), 'DESC']],
      limit: 5,
      raw: true,
    });

    // ── 5. Average confidence ─────────────────────────────────
    const avgResult = await PredictionLog.findOne({
      attributes: [[fn('AVG', col('confidence')), 'avg_confidence']],
      raw: true,
    });
    const avgConfidence = avgResult?.avg_confidence
      ? parseFloat(parseFloat(avgResult.avg_confidence).toFixed(2))
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        total_predictions: totalPredictions,
        accuracy_rate: accuracyRate,
        overridden_count: overriddenCount,
        override_rate: Math.round((overriddenCount / totalPredictions) * 100),
        top_categories: topCategories.map((c) => ({
          category: c.predicted_category,
          count: parseInt(c.count),
        })),
        avg_confidence: avgConfidence,
      },
    });
  } catch (err) {
    console.error('[AdminController.getPredictionStats]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getPredictionStats };
