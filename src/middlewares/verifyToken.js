'use strict';

/**
 * verifyToken Middleware
 *
 * Memverifikasi JWT dari header Authorization: Bearer <token>.
 * Jika valid, menyimpan decoded payload ke req.user.
 */

const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Token tidak ditemukan.',
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'finz-default-secret'
    );

    // Simpan user info di request object
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token sudah kedaluwarsa. Silakan login kembali.',
      });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Gagal memverifikasi token.',
    });
  }
};

module.exports = verifyToken;
