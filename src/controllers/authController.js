'use strict';

/**
 * Auth Controller
 *
 * Handles: register, login, me (get current user from JWT).
 */

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { User } = require('../models');

const SALT_ROUNDS = 10;

/**
 * Generate JWT for a user
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET || 'finz-default-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password, monthly_income, age, occupation, financial_goal, risk_profile } = req.body;

    // Validasi dasar
    if (!name || !email || !password) {
      return res.status(422).json({
        success: false,
        message: 'Name, email, dan password wajib diisi.',
      });
    }

    if (password.length < 6) {
      return res.status(422).json({
        success: false,
        message: 'Password minimal 6 karakter.',
      });
    }

    // Cek email unik
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Email sudah terdaftar.',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Buat user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      monthly_income: monthly_income || 0,
      age: age || null,
      occupation: occupation || null,
      financial_goal: financial_goal || null,
      risk_profile: risk_profile || null,
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil!',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          monthly_income: parseFloat(user.monthly_income),
          age: user.age,
          occupation: user.occupation,
          financial_goal: user.financial_goal,
          risk_profile: user.risk_profile,
        },
      },
    });
  } catch (err) {
    console.error('[AuthController.register]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(422).json({
        success: false,
        message: 'Email dan password wajib diisi.',
      });
    }

    // Cari user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah.',
      });
    }

    // Verifikasi password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah.',
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login berhasil!',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          monthly_income: parseFloat(user.monthly_income),
          age: user.age,
          occupation: user.occupation,
          financial_goal: user.financial_goal,
          risk_profile: user.risk_profile,
        },
      },
    });
  } catch (err) {
    console.error('[AuthController.login]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/auth/me  (requires verifyToken)
// ─────────────────────────────────────────────────────────────
const me = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan.',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        monthly_income: parseFloat(user.monthly_income),
        age: user.age,
        occupation: user.occupation,
        financial_goal: user.financial_goal,
        risk_profile: user.risk_profile,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error('[AuthController.me]', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { register, login, me };
