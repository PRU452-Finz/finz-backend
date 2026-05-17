'use strict';

/**
 * AI Client — HTTP wrapper ke Flask AI API
 *
 * Semua panggilan ke AI inference service (Flask) dikumpulkan di sini.
 * Mendukung timeout, error handling, dan logging.
 *
 * Endpoints yang di-wrap:
 *   POST /predict/kategori   → predictKategori
 *   POST /predict/saldo      → predictSaldo
 *   POST /predict/batch      → predictBatch
 *   POST /alerts/generate    → generateAlerts
 *   GET  /alerts/:uid/:bulan → getAlerts
 *   POST /alerts/:uid/:bulan/read → markAlertsRead
 *   GET  /alerts/:uid/history → getAlertHistory
 *   GET  /health              → healthCheck
 */

const axios = require('axios');

// ─────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────
const AI_BASE_URL = process.env.AI_API_URL || 'http://localhost:5000';
const TIMEOUT_MS  = 15000; // 15 detik timeout

const client = axios.create({
  baseURL: AI_BASE_URL,
  timeout: TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

// ─────────────────────────────────────────────────────────────
// Mapping Kategori AI ↔ Backend
// AI model: Formal Indonesia (10 kategori)
// Backend ENUM: lowercase slug (8 kategori)
// ─────────────────────────────────────────────────────────────
const AI_TO_BACKEND_CATEGORY = {
  'Tagihan':               'tagihan',
  'Makan & Minum':         'makanan',
  'Transportasi':          'transport',
  'Hiburan':               'hiburan',
  'Belanja Online':        'belanja',
  'Pendidikan':            'pendidikan',
  'Kesehatan':             'kesehatan',
  'Perawatan Diri':        'lainnya',
  'Investasi & Tabungan':  'lainnya',
  'Keluarga & Sosial':     'lainnya',
};

const BACKEND_TO_AI_CATEGORY = {
  'tagihan':    'Tagihan',
  'makanan':    'Makan & Minum',
  'transport':  'Transportasi',
  'hiburan':    'Hiburan',
  'belanja':    'Belanja Online',
  'pendidikan': 'Pendidikan',
  'kesehatan':  'Kesehatan',
  'lainnya':    'Keluarga & Sosial',
};

/**
 * Konversi kategori AI ke format backend
 */
const mapAiCategory = (aiCategory) => {
  return AI_TO_BACKEND_CATEGORY[aiCategory] || 'lainnya';
};

// ─────────────────────────────────────────────────────────────
// Error helper
// ─────────────────────────────────────────────────────────────
const handleError = (err, context) => {
  if (err.response) {
    // AI API returned an error response
    console.error(`[aiClient.${context}] AI API error ${err.response.status}:`, err.response.data);
  } else if (err.code === 'ECONNREFUSED' || err.code === 'ECONNABORTED') {
    console.error(`[aiClient.${context}] AI API unreachable (${err.code})`);
  } else {
    console.error(`[aiClient.${context}]`, err.message);
  }
  throw err;
};

// ─────────────────────────────────────────────────────────────
// API Methods
// ─────────────────────────────────────────────────────────────

/**
 * Klasifikasi kategori transaksi — single atau batch
 * @param {string|string[]} deskripsi
 * @returns {Promise<object>} Response dari AI API
 */
const predictKategori = async (deskripsi) => {
  try {
    const { data } = await client.post('/predict/kategori', { deskripsi });
    return data;
  } catch (err) {
    handleError(err, 'predictKategori');
  }
};

/**
 * Prediksi saldo akhir bulan
 * @param {object} payload — { total_pengeluaran, total_income, n_transaksi, avg_pengeluaran, saldo_awal, ...kategori }
 * @returns {Promise<object>}
 */
const predictSaldo = async (payload) => {
  try {
    const { data } = await client.post('/predict/saldo', payload);
    return data;
  } catch (err) {
    handleError(err, 'predictSaldo');
  }
};

/**
 * Batch: klasifikasi + prediksi saldo sekaligus
 * @param {object} payload — { transaksi: [{deskripsi, jumlah}], saldo_awal, total_income }
 * @returns {Promise<object>}
 */
const predictBatch = async (payload) => {
  try {
    const { data } = await client.post('/predict/batch', payload);
    return data;
  } catch (err) {
    handleError(err, 'predictBatch');
  }
};

/**
 * Generate budget alerts
 * @param {object} payload
 * @returns {Promise<object>}
 */
const generateAlerts = async (payload) => {
  try {
    const { data } = await client.post('/alerts/generate', payload);
    return data;
  } catch (err) {
    handleError(err, 'generateAlerts');
  }
};

/**
 * Ambil alerts user per bulan
 * @param {string} userId
 * @param {string} bulan — format "2026-05"
 * @returns {Promise<object>}
 */
const getAlerts = async (userId, bulan) => {
  try {
    const { data } = await client.get(`/alerts/${userId}/${bulan}`);
    return data;
  } catch (err) {
    handleError(err, 'getAlerts');
  }
};

/**
 * Tandai alert sebagai dibaca
 * @param {string} userId
 * @param {string} bulan
 * @param {string|null} alertId — null = tandai semua
 * @returns {Promise<object>}
 */
const markAlertsRead = async (userId, bulan, alertId = null) => {
  try {
    const body = alertId ? { alert_id: alertId } : {};
    const { data } = await client.post(`/alerts/${userId}/${bulan}/read`, body);
    return data;
  } catch (err) {
    handleError(err, 'markAlertsRead');
  }
};

/**
 * Riwayat alert semua bulan
 * @param {string} userId
 * @returns {Promise<object>}
 */
const getAlertHistory = async (userId) => {
  try {
    const { data } = await client.get(`/alerts/${userId}/history`);
    return data;
  } catch (err) {
    handleError(err, 'getAlertHistory');
  }
};

/**
 * Health check AI API
 * @returns {Promise<object>}
 */
const healthCheck = async () => {
  try {
    const { data } = await client.get('/health');
    return data;
  } catch (err) {
    handleError(err, 'healthCheck');
  }
};

/**
 * Cek apakah AI API bisa diakses
 * @returns {Promise<boolean>}
 */
const isAvailable = async () => {
  try {
    await client.get('/health', { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
};

module.exports = {
  predictKategori,
  predictSaldo,
  predictBatch,
  generateAlerts,
  getAlerts,
  markAlertsRead,
  getAlertHistory,
  healthCheck,
  isAvailable,
  mapAiCategory,
  AI_TO_BACKEND_CATEGORY,
  BACKEND_TO_AI_CATEGORY,
  AI_BASE_URL,
};
