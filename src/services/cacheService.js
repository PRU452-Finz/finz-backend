'use strict';

const logger = require('../config/logger');

const redis = require('../config/redis');

const TTL = {
  AI_HEALTH: 30,
  PREDICTION: 300,
  DASHBOARD: 60,
  FINANCIAL_SCORE: 300,
  RECOMMENDATIONS: 600,
  BUDGET_ALERTS: 120,
};

const keys = {
  aiHealth: () => 'finz:cache:ai:health',
  dashboard: (userId) => `finz:cache:dashboard:${userId}`,
  prediction: (userId, type) => `finz:cache:prediction:${userId}:${type}`,
  financialScore: (userId) => `finz:cache:score:${userId}`,
  recommendations: (userId) => `finz:cache:reco:${userId}`,
  budgetAlerts: (userId, month) => `finz:cache:alerts:${userId}:${month}`,
};

const cacheService = {
  async get(key) {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      logger.warn(`[cacheService.get] ${key}:`, err.message);
      return null;
    }
  },

  async set(key, value, ttl) {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (err) {
      logger.warn(`[cacheService.set] ${key}:`, err.message);
    }
  },

  async del(key) {
    try {
      await redis.del(key);
    } catch (err) {
      logger.warn(`[cacheService.del] ${key}:`, err.message);
    }
  },

  async delPattern(pattern) {
    try {
      const stream = redis.scanStream({ match: pattern, count: 100 });
      const pipeline = redis.pipeline();
      let count = 0;

      for await (const resultKeys of stream) {
        if (resultKeys.length === 0) continue;
        resultKeys.forEach((key) => pipeline.del(key));
        count += resultKeys.length;
      }

      if (count > 0) {
        await pipeline.exec();
      }
    } catch (err) {
      logger.warn(`[cacheService.delPattern] ${pattern}:`, err.message);
    }
  },

  keys,
  TTL,
};

module.exports = cacheService;
