'use strict';

const winston = require('winston');

const isProduction = process.env.NODE_ENV === 'production';

const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.splat(),
  winston.format.simple()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: isProduction ? productionFormat : developmentFormat,
  transports: [
    new winston.transports.Console(),
  ],
});

module.exports = logger;
