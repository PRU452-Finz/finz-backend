'use strict';

const CircuitBreaker = require('opossum');
const logger = require('../config/logger');

const breakerOptions = {
  timeout: 30000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
  volumeThreshold: 5,
};

const createBreaker = (fn) => {
  const breaker = new CircuitBreaker(fn, breakerOptions);

  breaker.on('open', () => {
    logger.warn('[CircuitBreaker] Open');
  });

  breaker.on('halfOpen', () => {
    logger.warn('[CircuitBreaker] Half-open');
  });

  breaker.on('close', () => {
    logger.info('[CircuitBreaker] Closed');
  });

  return breaker;
};

module.exports = { createBreaker };
