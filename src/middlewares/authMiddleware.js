'use strict';

const logger = require('../config/logger');

/**
 * Auth Middleware — JWT Verification
 *
 * Memverifikasi Bearer token dari header Authorization.
 * Jika valid, attach user data ke req.user.
 * Jika tidak valid, return 401 Unauthorized.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/auth');

const authMiddleware = async (req, res, next) => {
  try {
    // 1. Ambil token dari header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Token tidak ditemukan.',
      });
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token sudah kedaluwarsa. Silakan login kembali.',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid.',
      });
    }

    // 3. Cek apakah user masih ada di database
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User tidak ditemukan. Token tidak valid.',
      });
    }

    // 4. Attach user ke request
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      initial_balance: user.initial_balance,
    };

    next();
  } catch (err) {
    logger.error('[AuthMiddleware] Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = authMiddleware;
