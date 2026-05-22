'use strict';

const logger = require('../config/logger');

/**
 * Error Handler Middleware
 *
 * Menangkap semua error yang tidak tertangani di lapisan controller/service.
 * Harus di-register sebagai middleware TERAKHIR di app.js.
 */
const errorHandler = (err, req, res, next) => {
  // Sequelize Validation Error
  if (err.name === 'SequelizeValidationError') {
    return res.status(422).json({
      success: false,
      message: 'Validasi database gagal',
      errors: err.errors.map((e) => ({ field: e.path, message: e.message })),
    });
  }

  // Sequelize Unique Constraint
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Data sudah ada (duplikat)',
      errors: err.errors.map((e) => ({ field: e.path, message: e.message })),
    });
  }

  // Default 500
  logger.error('[ErrorHandler]', err);
  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
};

module.exports = errorHandler;
