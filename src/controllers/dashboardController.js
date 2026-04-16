'use strict';

/**
 * Dashboard Controller
 * Handles GET /api/dashboard
 */

const dashboardService = require('../services/dashboardService');

const getDashboard = async (req, res) => {
  try {
    const user_id = parseInt(req.query.user_id) || 1;
    const summary = await dashboardService.getDashboardSummary(user_id);

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (err) {
    console.error('[DashboardController.getDashboard]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { getDashboard };
