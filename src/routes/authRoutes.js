'use strict';

/**
 * Auth Routes
 * Base path: /api/auth
 *
 * POST /api/auth/register  — Daftar akun baru
 * POST /api/auth/login     — Login dan dapatkan token
 * GET  /api/auth/me        — Ambil profil user yang sedang login
 */

const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// Public routes (tidak perlu token)
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected route (perlu token)
router.get('/me', authMiddleware, authController.me);

module.exports = router;
