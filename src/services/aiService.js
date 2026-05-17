'use strict';

/**
 * AI Service
 *
 * Menghubungkan backend FinZ ke Flask AI API untuk inferensi ML.
 * Setiap fungsi menyediakan fallback ke logika mock jika AI API tidak tersedia.
 *
 * Endpoint yang digunakan:
 *   - predictCategory  → Flask /predict/kategori (TF-IDF + MLP)
 *   - predictBalance   → Flask /predict/saldo   (DNN Regressor)
 *   - generateBudgetAlerts → Flask /alerts/generate (Rule Matrix Engine)
 */

const { Op } = require('sequelize');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const aiClient = require('./aiClient');

// ─────────────────────────────────────────────────────────────
// 1.  Prediksi Saldo Akhir Bulan
// ─────────────────────────────────────────────────────────────

/**
 * Estimasi saldo di akhir bulan.
 * Prioritas: panggil AI API. Fallback: rata-rata harian (mock).
 *
 * @param {object} params  { current_balance, user_id }
 */
const predictBalance = async ({ current_balance, user_id = 1 }) => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const today = now.toISOString().slice(0, 10);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysPassed = now.getDate();
  const daysRemaining = daysInMonth - daysPassed;

  // Ambil transaksi bulan ini dari DB
  const rows = await Transaction.findAll({
    where: {
      user_id,
      date: { [Op.between]: [firstDay, today] },
    },
  });

  const spentSoFar = rows.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const avgPerDay = daysPassed > 0 ? spentSoFar / daysPassed : 0;

  // ── Coba panggil AI API ────────────────────────────────────
  try {
    const aiAvailable = await aiClient.isAvailable();

    if (aiAvailable) {
      // Hitung breakdown per kategori (dalam format AI)
      const categoryTotals = {};
      for (const t of rows) {
        const aiCat = aiClient.BACKEND_TO_AI_CATEGORY[t.category] || 'Keluarga & Sosial';
        categoryTotals[aiCat] = (categoryTotals[aiCat] || 0) + parseFloat(t.amount);
      }

      const saldoPayload = {
        total_pengeluaran: spentSoFar,
        total_income: parseFloat(current_balance), // saldo awal sebagai proxy income
        n_transaksi: rows.length,
        avg_pengeluaran: rows.length > 0 ? spentSoFar / rows.length : 0,
        saldo_awal: parseFloat(current_balance),
        // Kategori AI — isi 0 jika tidak ada
        'Tagihan':              categoryTotals['Tagihan'] || 0,
        'Makan & Minum':        categoryTotals['Makan & Minum'] || 0,
        'Transportasi':         categoryTotals['Transportasi'] || 0,
        'Hiburan':              categoryTotals['Hiburan'] || 0,
        'Belanja Online':       categoryTotals['Belanja Online'] || 0,
        'Pendidikan':           categoryTotals['Pendidikan'] || 0,
        'Kesehatan':            categoryTotals['Kesehatan'] || 0,
        'Perawatan Diri':       categoryTotals['Perawatan Diri'] || 0,
        'Investasi & Tabungan': categoryTotals['Investasi & Tabungan'] || 0,
        'Keluarga & Sosial':    categoryTotals['Keluarga & Sosial'] || 0,
      };

      const aiResult = await aiClient.predictSaldo(saldoPayload);

      const predicted = aiResult.prediksi_saldo_akhir;
      const ratio = predicted / parseFloat(current_balance);

      let status;
      if (ratio >= 0.5)      status = 'aman';
      else if (ratio >= 0.2) status = 'warning';
      else                   status = 'bahaya';

      const messages = {
        aman:    'Pengeluaranmu terkontrol dengan baik. Pertahankan pola ini!',
        warning: 'Pengeluaranmu cukup tinggi bulan ini. Kurangi belanja hiburan untuk menjaga saldo.',
        bahaya:  'Peringatan! Saldo kamu berisiko habis sebelum akhir bulan. Segera kurangi pengeluaran.',
      };

      return {
        current_balance: parseFloat(current_balance),
        spent_so_far: spentSoFar,
        avg_per_day: avgPerDay,
        days_remaining: daysRemaining,
        predicted_balance: Math.round(predicted),
        status,
        message: messages[status],
        ai_powered: true,
        cached: aiResult.cached || false,
      };
    }
  } catch (err) {
    console.warn('[aiService.predictBalance] AI API fallback:', err.message);
  }

  // ── Fallback: Mock calculation ──────────────────────────────
  const projectedAdditional = avgPerDay * daysRemaining;
  const predicted_balance = Math.max(0, current_balance - projectedAdditional);

  const ratio = predicted_balance / current_balance;
  let status;
  if (ratio >= 0.5)      status = 'aman';
  else if (ratio >= 0.2) status = 'warning';
  else                   status = 'bahaya';

  const messages = {
    aman:    'Pengeluaranmu terkontrol dengan baik. Pertahankan pola ini!',
    warning: 'Pengeluaranmu cukup tinggi bulan ini. Kurangi belanja hiburan untuk menjaga saldo.',
    bahaya:  'Peringatan! Saldo kamu berisiko habis sebelum akhir bulan. Segera kurangi pengeluaran.',
  };

  return {
    current_balance: parseFloat(current_balance),
    spent_so_far: spentSoFar,
    avg_per_day: avgPerDay,
    days_remaining: daysRemaining,
    predicted_balance: Math.round(predicted_balance),
    status,
    message: messages[status],
    ai_powered: false,
  };
};

// ─────────────────────────────────────────────────────────────
// 2.  Klasifikasi Kategori Transaksi
// ─────────────────────────────────────────────────────────────

/**
 * Klasifikasi kategori dari deskripsi teks.
 * Prioritas: AI API (TF-IDF + MLP). Fallback: rule-based keyword matching.
 *
 * @param {string} description
 * @returns {Promise<{ category: string, confidence: number|string, ai_powered: boolean }>}
 */
const predictCategory = async (description) => {
  if (!description) return { category: 'lainnya', confidence: 0, ai_powered: false };

  // ── Coba panggil AI API ────────────────────────────────────
  try {
    const aiAvailable = await aiClient.isAvailable();

    if (aiAvailable) {
      const aiResult = await aiClient.predictKategori(description);

      // AI returns: { deskripsi, kategori, confidence, latency_ms }
      const aiCategory = aiResult.kategori;
      const backendCategory = aiClient.mapAiCategory(aiCategory);

      return {
        category: backendCategory,
        confidence: aiResult.confidence,
        ai_category: aiCategory,
        ai_powered: true,
        latency_ms: aiResult.latency_ms,
      };
    }
  } catch (err) {
    console.warn('[aiService.predictCategory] AI API fallback:', err.message);
  }

  // ── Fallback: Rule-based keyword matching ───────────────────
  return predictCategoryFallback(description);
};

// ── Rule-based fallback (original mock logic) ─────────────────
const CATEGORY_RULES = [
  {
    category: 'makanan',
    keywords: ['makan', 'kopi', 'resto', 'bakso', 'sushi', 'dinner',
               'sarapan', 'kantin', 'warung', 'warteg', 'mcd', 'mcdonalds',
               'burger', 'pizza', 'ayam', 'nasi', 'mie', 'kfc', 'delivery',
               'grabfood', 'gofood', 'shopeefood', 'es teh', 'boba'],
  },
  {
    category: 'transport',
    keywords: ['gojek', 'grab', 'taxi', 'taksi', 'bensin', 'parkir',
               'stasiun', 'busway', 'mrt', 'lrt', 'krl', 'kereta', 'bus',
               'angkot', 'ojek', 'motor', 'toll', 'tol'],
  },
  {
    category: 'hiburan',
    keywords: ['nonton', 'game', 'spotify', 'netflix', 'bioskop', 'cinema',
               'youtube', 'disney', 'hbo', 'main', 'tiket', 'konser',
               'streaming', 'mobile legends', 'ml', 'top up'],
  },
  {
    category: 'belanja',
    keywords: ['beli', 'baju', 'sepatu', 'tokopedia', 'shopee', 'lazada',
               'skincare', 'fashion', 'tas', 'dompet', 'aksesoris', 'hp',
               'gadget', 'uniqlo', 'zara', 'h&m', 'earbuds', 'case'],
  },
  {
    category: 'tagihan',
    keywords: ['listrik', 'air', 'internet', 'kuota', 'bayar', 'tagihan',
               'pdam', 'pln', 'wifi', 'langganan', 'iuran', 'cicilan'],
  },
  {
    category: 'pendidikan',
    keywords: ['buku', 'kursus', 'kuliah', 'seminar', 'workshop', 'les',
               'fotocopy', 'print', 'alat tulis', 'kampus', 'spp', 'ukt'],
  },
  {
    category: 'kesehatan',
    keywords: ['obat', 'dokter', 'gym', 'vitamin', 'apotek', 'klinik',
               'rumah sakit', 'rs', 'puskesmas', 'fitness', 'masker',
               'suplemen', 'cek', 'lab'],
  },
];

const predictCategoryFallback = (description) => {
  const desc = description.toLowerCase().trim();

  for (const rule of CATEGORY_RULES) {
    const matched = rule.keywords.some((kw) => desc.includes(kw));
    if (matched) {
      return {
        category: rule.category,
        confidence: 'high',
        matched_keywords: rule.keywords.filter((kw) => desc.includes(kw)),
        ai_powered: false,
      };
    }
  }

  return { category: 'lainnya', confidence: 'low', matched_keywords: [], ai_powered: false };
};

// ─────────────────────────────────────────────────────────────
// 3.  Rekomendasi Finansial
// ─────────────────────────────────────────────────────────────

const RECOMMENDATION_TEMPLATES = {
  makanan: {
    id: 1,
    title: 'Kurangi Pengeluaran Makanan',
    description:
      'Pengeluaran makananmu di atas 30% dari total. Coba meal prep di rumah untuk hemat hingga Rp500.000/bulan.',
    type: 'warning',
    icon: '🍔',
  },
  hiburan: {
    id: 2,
    title: 'Batasi Pengeluaran Hiburan',
    description:
      'Budget hiburanmu cukup besar. Pertimbangkan untuk berlangganan layanan streaming bersama teman.',
    type: 'warning',
    icon: '🎮',
  },
  belanja: {
    id: 3,
    title: 'Terapkan 24-Hour Rule Sebelum Belanja',
    description:
      'Tunggu 24 jam sebelum membeli barang non-esensial. Ini membantu menghindari impulse buying.',
    type: 'tip',
    icon: '🛍️',
  },
};

const GENERAL_RECOMMENDATIONS = [
  {
    id: 10,
    title: 'Mulai Investasi Kecil',
    description:
      'Kamu bisa mulai investasi reksadana mulai Rp100.000. Pertimbangkan alokasi 10% penghasilan.',
    type: 'tip',
    icon: '📈',
  },
  {
    id: 11,
    title: 'Buat Dana Darurat',
    description:
      'Siapkan dana darurat 3–6 bulan pengeluaran. Simpan di tabungan terpisah agar tidak terpakai.',
    type: 'important',
    icon: '🛡️',
  },
  {
    id: 12,
    title: 'Gunakan E-Wallet dengan Cashback',
    description:
      'Manfaatkan promo cashback dari DANA atau OVO untuk pengeluaran rutin sehari-hari.',
    type: 'tip',
    icon: '💰',
  },
  {
    id: 13,
    title: 'Catat Keuangan Setiap Hari',
    description:
      'Mencatat pengeluaran harian membantu kamu sadar ke mana uang pergi. Lakukan setiap malam.',
    type: 'tip',
    icon: '📓',
  },
];

/**
 * Buat daftar rekomendasi berdasarkan pola transaksi user
 * @param {number} user_id
 */
const getRecommendations = async (user_id = 1) => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  const { Op } = require('sequelize');
  const txns = await Transaction.findAll({
    where: {
      user_id,
      date: { [Op.between]: [firstDay, lastDay] },
    },
  });

  const total = txns.reduce((s, t) => s + parseFloat(t.amount), 0);
  if (total === 0) return GENERAL_RECOMMENDATIONS;

  // Hitung porsi per kategori
  const categoryTotals = {};
  for (const t of txns) {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + parseFloat(t.amount);
  }

  const recommendations = [];

  // Tambah rekomendasi kategori jika melewati threshold
  const THRESHOLDS = { makanan: 0.3, hiburan: 0.2, belanja: 0.25 };
  for (const [cat, threshold] of Object.entries(THRESHOLDS)) {
    const ratio = (categoryTotals[cat] || 0) / total;
    if (ratio > threshold && RECOMMENDATION_TEMPLATES[cat]) {
      recommendations.push({
        ...RECOMMENDATION_TEMPLATES[cat],
        detail: `${Math.round(ratio * 100)}% dari total pengeluaran bulan ini`,
      });
    }
  }

  // Selalu sertakan rekomendasi umum
  return [...recommendations, ...GENERAL_RECOMMENDATIONS];
};

// ─────────────────────────────────────────────────────────────
// 4.  Financial Health Score
// ─────────────────────────────────────────────────────────────

/**
 * Hitung financial health score berdasarkan pola transaksi
 * @param {number} user_id
 */
const getFinancialScore = async (user_id = 1) => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  const { Op } = require('sequelize');
  const txns = await Transaction.findAll({
    where: {
      user_id,
      date: { [Op.between]: [firstDay, lastDay] },
    },
  });

  if (txns.length === 0) {
    return {
      score: 50,
      level: 'Belum Ada Data',
      breakdown: {
        saving_ratio: 50,
        spending_consistency: 50,
        category_diversity: 50,
        bill_payment: 50,
      },
    };
  }

  const total = txns.reduce((s, t) => s + parseFloat(t.amount), 0);
  
  // ── Saving Ratio (Dihitung berdasarkan income riil user) ──
  const user = await User.findByPk(user_id);
  const income = user ? parseFloat(user.monthly_income) : 5000000;
  const savingRatio = Math.max(0, Math.min(100, ((income - total) / income) * 100));

  // ── Spending Consistency (variasi harian) ──
  const dailyMap = {};
  for (const t of txns) {
    dailyMap[t.date] = (dailyMap[t.date] || 0) + parseFloat(t.amount);
  }
  const dailyAmounts = Object.values(dailyMap);
  const avgDaily = dailyAmounts.reduce((a, b) => a + b, 0) / dailyAmounts.length;
  const variance = dailyAmounts.reduce((sum, d) => sum + Math.pow(d - avgDaily, 2), 0) / dailyAmounts.length;
  const stdDev = Math.sqrt(variance);
  const cv = avgDaily > 0 ? stdDev / avgDaily : 0; // Coefficient of variation
  const spendingConsistency = Math.max(0, Math.min(100, 100 - cv * 50));

  // ── Category Diversity ──
  const categories = new Set(txns.map((t) => t.category));
  const categoryDiversity = Math.min(100, (categories.size / 6) * 100);

  // ── Bill Payment Score ──
  const hasTagihan = txns.some((t) => t.category === 'tagihan');
  const billPayment = hasTagihan ? 80 : 50;

  // ── Total Score (weighted) ──
  const score = Math.round(
    savingRatio * 0.35 +
    spendingConsistency * 0.30 +
    categoryDiversity * 0.20 +
    billPayment * 0.15
  );

  const getLevel = (s) => {
    if (s >= 80) return 'Sangat Sehat';
    if (s >= 60) return 'Cukup Sehat';
    if (s >= 40) return 'Perlu Perbaikan';
    return 'Tidak Sehat';
  };

  return {
    score,
    level: getLevel(score),
    breakdown: {
      saving_ratio:          Math.round(savingRatio),
      spending_consistency:  Math.round(spendingConsistency),
      category_diversity:    Math.round(categoryDiversity),
      bill_payment:          Math.round(billPayment),
    },
  };
};

// ─────────────────────────────────────────────────────────────
// 5.  Budget Alert (NEW — proxy ke AI API)
// ─────────────────────────────────────────────────────────────

/**
 * Generate budget alerts via AI Rule Matrix Engine
 * @param {object} params
 */
const generateBudgetAlerts = async (params) => {
  const {
    user_id,
    bulan,
    total_income,
    total_pengeluaran,
    saldo_awal,
    prediksi_saldo_akhir,
    pengeluaran_per_kategori,
    budgets,
  } = params;

  // Jika prediksi_saldo_akhir belum tersedia, coba predict dulu
  let saldoPrediksi = prediksi_saldo_akhir;
  if (!saldoPrediksi && saldo_awal) {
    try {
      const saldoResult = await aiClient.predictSaldo({
        total_pengeluaran: total_pengeluaran || 0,
        total_income: total_income || 0,
        n_transaksi: 0,
        avg_pengeluaran: 0,
        saldo_awal: saldo_awal,
      });
      saldoPrediksi = saldoResult.prediksi_saldo_akhir;
    } catch {
      saldoPrediksi = saldo_awal - (total_pengeluaran || 0);
    }
  }

  const payload = {
    user_id: String(user_id),
    bulan: bulan || new Date().toISOString().slice(0, 7),
    total_income: total_income || 0,
    total_pengeluaran: total_pengeluaran || 0,
    saldo_awal: saldo_awal || 0,
    prediksi_saldo_akhir: saldoPrediksi || 0,
    pengeluaran_per_kategori: pengeluaran_per_kategori || {},
    budgets: budgets || undefined,
  };

  return await aiClient.generateAlerts(payload);
};

/**
 * Ambil budget alerts per user per bulan
 */
const getBudgetAlerts = async (userId, bulan) => {
  return await aiClient.getAlerts(String(userId), bulan);
};

/**
 * Tandai alert sebagai dibaca
 */
const markAlertRead = async (userId, bulan, alertId = null) => {
  return await aiClient.markAlertsRead(String(userId), bulan, alertId);
};

/**
 * Riwayat alert semua bulan
 */
const getAlertHistory = async (userId) => {
  return await aiClient.getAlertHistory(String(userId));
};

module.exports = {
  predictBalance,
  predictCategory,
  getRecommendations,
  getFinancialScore,
  generateBudgetAlerts,
  getBudgetAlerts,
  markAlertRead,
  getAlertHistory,
};
