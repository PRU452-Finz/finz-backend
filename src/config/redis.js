'use strict';

const logger = require('./logger');

require('dotenv').config();

const Redis = require('ioredis');

const redisOptions = {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) return null;
    return Math.min(times * 200, 1000);
  },
};

// Enable TLS for Upstash Redis or production hosts
if (
  process.env.REDIS_TLS === 'true' || 
  (process.env.REDIS_URL && (process.env.REDIS_URL.startsWith('rediss://') || process.env.REDIS_URL.includes('upstash.io')))
) {
  redisOptions.tls = {};
}

let redis;
if (process.env.REDIS_URL) {
  let url = process.env.REDIS_URL;
  // Convert redis:// to rediss:// if TLS is enabled or if it's Upstash
  if ((process.env.REDIS_TLS === 'true' || url.includes('upstash.io')) && url.startsWith('redis://')) {
    url = url.replace('redis://', 'rediss://');
  }
  redis = new Redis(url, redisOptions);
} else {
  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: Number(process.env.REDIS_DB) || 0,
    ...redisOptions,
  });
}

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
