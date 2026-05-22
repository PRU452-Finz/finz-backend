'use strict';

const logger = require('./logger');

require('dotenv').config();

const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: Number(process.env.REDIS_DB) || 0,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) return null;
    return Math.min(times * 200, 1000);
  },
});

redis.on('connect', () => {
  logger.info('✅  Redis connected');
});

redis.on('error', (err) => {
  logger.error('❌  Redis error:', err.message);
});

redis.on('reconnecting', () => {
  logger.warn('↻  Redis reconnecting...');
});

module.exports = redis;
