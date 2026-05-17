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
const rateLimit  = require('express-rate-limit');

const requestLogger    = require('./middlewares/requestLogger');
const errorHandler     = require('./middlewares/errorHandler');
const transactionRoutes = require('./routes/transactionRoutes');
const dashboardRoutes   = require('./routes/dashboardRoutes');
const aiRoutes          = require('./routes/aiRoutes');
const userRoutes        = require('./routes/userRoutes');
const authRoutes        = require('./routes/authRoutes');

const app = express();

// ─────────────────────────────────────────────────────────────
// Rate Limiting
// ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10,                   // Maks 10 percobaan login/register per 15 menit
  message: { success: false, message: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Rate limit tercapai. Coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders: false,
});

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
    ai_api_url: process.env.AI_API_URL || 'http://localhost:5000',
    endpoints: {
      auth:                  '/api/auth/register | /api/auth/login',
      transactions:          '/api/transactions',
      dashboard:             '/api/dashboard',
      predictBalance:        '/api/predict/balance',
      predictCategory:       '/api/predict/category',
      recommendation:        '/api/recommendation/:user_id',
      financialScore:        '/api/financial-score/:user_id',
      aiHealth:              '/api/ai/health',
      budgetAlertGenerate:   '/api/budget-alert/generate',
      budgetAlertGet:        '/api/budget-alert/:user_id/:bulan',
      budgetAlertRead:       '/api/budget-alert/:user_id/:bulan/read',
      budgetAlertHistory:    '/api/budget-alert/:user_id/history',
    },
  });
});

// ─────────────────────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────────────────────
app.use('/api/auth',         authLimiter, authRoutes);   // Rate limited ketat
app.use('/api/transactions', apiLimiter,  transactionRoutes);
app.use('/api/dashboard',    apiLimiter,  dashboardRoutes);
app.use('/api/users',        apiLimiter,  userRoutes);
app.use('/api',              apiLimiter,  aiRoutes);

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
