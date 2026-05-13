'use strict';

/**
 * FinZ Backend — app.js
 *
 * Konfigurasi Express, middleware global, dan routing.
 * Dipisah dari server.js agar mudah di-test secara terpisah.
 */

require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const path       = require('path');

const requestLogger     = require('./middlewares/requestLogger');
const errorHandler      = require('./middlewares/errorHandler');
const transactionRoutes = require('./routes/transactionRoutes');
const dashboardRoutes   = require('./routes/dashboardRoutes');
const aiRoutes          = require('./routes/aiRoutes');
const authRoutes        = require('./routes/authRoutes');
const userRoutes        = require('./routes/userRoutes');
const budgetRoutes      = require('./routes/budgetRoutes');
const budgetAlertRoutes = require('./routes/budgetAlertRoutes');
const adminRoutes       = require('./routes/adminRoutes');

const app = express();

// ─────────────────────────────────────────────────────────────
// CORS — izinkan request dari frontend FinZ
// ─────────────────────────────────────────────────────────────
const corsOptions = {
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Preflight

// ─────────────────────────────────────────────────────────────
// Body Parser
// ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────────────────────
// Logger
// ─────────────────────────────────────────────────────────────
app.use(requestLogger);

// ─────────────────────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    app: process.env.APP_NAME || 'FinZ Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth_register:   '/api/auth/register',
      auth_login:      '/api/auth/login',
      auth_me:         '/api/auth/me',
      users:           '/api/users/:id',
      transactions:    '/api/transactions',
      budgets:         '/api/budgets/:user_id',
      budget_alert:    '/api/budget-alert/:user_id',
      dashboard:       '/api/dashboard',
      predictBalance:  '/api/predict/balance',
      predictCategory: '/api/predict/category',
      recommendation:  '/api/recommendation/:user_id',
      financialScore:  '/api/financial-score/:user_id',
      admin_stats:     '/api/admin/prediction-stats',
    },
  });
});

// ─────────────────────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/transactions',  transactionRoutes);
app.use('/api/budgets',       budgetRoutes);
app.use('/api/budget-alert',  budgetAlertRoutes);
app.use('/api/dashboard',     dashboardRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api',               aiRoutes);   // /api/predict/*, /api/recommendation/*, /api/financial-score/*

// ─────────────────────────────────────────────────────────────
// 404 Handler
// ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} tidak ditemukan`,
  });
});

// ─────────────────────────────────────────────────────────────
// Global Error Handler (harus paling akhir)
// ─────────────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
