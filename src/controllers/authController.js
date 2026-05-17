'use strict';

/**
 * Auth Controller
 *
 * Handles user registration, login, and profile retrieval.
 * Returns JWT token upon successful auth.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'finz-default-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token for a user
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/register
// Body: { name, email, password, monthly_income?, occupation?, financial_goal? }
// ─────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password, monthly_income, age, occupation, financial_goal, risk_profile } = req.body;

    // Validasi input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nama, email, dan password wajib diisi.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password minimal 6 karakter.',
      });
    }

    // Cek apakah email sudah terdaftar
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email sudah terdaftar. Gunakan email lain atau login.',
      });
    }

    // Buat user baru (password di-hash otomatis oleh hook beforeCreate)
    const user = await User.create({
      name,
      email,
      password,
      monthly_income: monthly_income || 0,
      age: age || null,
      occupation: occupation || 'karyawan',
      financial_goal: financial_goal || 'dana_darurat',
      risk_profile: risk_profile || 'konservatif',
    });

    // Generate token
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil!',
      data: {
        token,
        user: user.toSafeJSON(),
      },
    });
  } catch (err) {
    console.error('[AuthController.register]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/login
// Body: { email, password }
// ─────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validasi input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password wajib diisi.',
      });
    }

    // Cari user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah.',
      });
    }

    // Verifikasi password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah.',
      });
    }

    // Generate token
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login berhasil!',
      data: {
        token,
        user: user.toSafeJSON(),
      },
    });
  } catch (err) {
    console.error('[AuthController.login]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/auth/me
// Headers: Authorization: Bearer <token>
// ─────────────────────────────────────────────────────────────
const me = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan.',
      });
    }

    return res.status(200).json({
      success: true,
      data: user.toSafeJSON(),
    });
  } catch (err) {
    console.error('[AuthController.me]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { register, login, me };
