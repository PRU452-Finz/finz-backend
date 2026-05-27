'use strict';

const logger = require('../config/logger');

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
const cacheService = require('./cacheService');
const { sanitizeText } = require('../utils/textSanitizer');

// ─────────────────────────────────────────────────────────────
// 1.  Prediksi Saldo Akhir Bulan
// ─────────────────────────────────────────────────────────────

/**
 * Estimasi saldo di akhir bulan.
 * Prioritas: panggil AI API. Fallback: rata-rata harian (mock).
 *
 * @param {object} params  { current_balance, user_id }
 */
const predictBalance = async ({ current_balance, user_id }) => {
  const cacheKey = cacheService.keys.prediction(user_id, 'balance');
  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

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

  // Pisahkan income vs expense
  let totalIncome = 0;
  let spentSoFar = 0;
  for (const t of rows) {
    const amount = parseFloat(t.amount);
    if (t.transaction_type === 'income') {
      totalIncome += amount;
    } else {
      spentSoFar += amount;
    }
  }
  const avgPerDay = daysPassed > 0 ? spentSoFar / daysPassed : 0;

  // ── Coba panggil AI API ────────────────────────────────────
  try {
    const aiAvailable = await aiClient.isAvailable();

    if (aiAvailable) {
      // Hitung breakdown per kategori (dalam format AI) — hanya expense
      const categoryTotals = {};
      for (const t of rows) {
        if (t.transaction_type === 'income') continue;
        const aiCat = aiClient.BACKEND_TO_AI_CATEGORY[t.category] || 'Keluarga & Sosial';
        categoryTotals[aiCat] = (categoryTotals[aiCat] || 0) + parseFloat(t.amount);
      }

      const saldoPayload = {
        total_pengeluaran: spentSoFar,
        total_income: totalIncome || parseFloat(current_balance),
        n_transaksi: rows.filter(t => t.transaction_type !== 'income').length,
        avg_pengeluaran: spentSoFar > 0 ? spentSoFar / rows.filter(t => t.transaction_type !== 'income').length : 0,
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

      let predicted = aiResult.prediksi_saldo_akhir;

      // Sanity check — prediksi AI tidak boleh melebihi saldo + income
      // dan tidak boleh lebih rendah dari -(current_balance)
      const maxReasonable = parseFloat(current_balance) + totalIncome;
      const minReasonable = -parseFloat(current_balance);
      if (predicted > maxReasonable || predicted < minReasonable) {
        // AI model output tidak masuk akal, fallback ke simple math
        const projectedAdditional = avgPerDay * daysRemaining;
        predicted = parseFloat(current_balance) - projectedAdditional;
        logger.warn(`[aiService.predictBalance] AI prediction out of range (${aiResult.prediksi_saldo_akhir}), using fallback: ${predicted}`);
      }

      const ratio = parseFloat(current_balance) > 0
        ? predicted / parseFloat(current_balance)
        : predicted >= 0 ? 1 : 0;

      let status;
      if (ratio >= 0.5)      status = 'aman';
      else if (ratio >= 0.2) status = 'warning';
      else                   status = 'bahaya';

      const messages = {
        aman:    'Pengeluaranmu terkontrol dengan baik. Pertahankan pola ini!',
        warning: 'Pengeluaranmu cukup tinggi bulan ini. Kurangi belanja hiburan untuk menjaga saldo.',
        bahaya:  'Peringatan! Saldo kamu berisiko habis sebelum akhir bulan. Segera kurangi pengeluaran.',
      };

      const result = {
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

      await cacheService.set(cacheKey, result, cacheService.TTL.PREDICTION);
      return result;
    }
  } catch (err) {
    logger.warn('[aiService.predictBalance] AI API fallback:', err.message);
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

  const result = {
    current_balance: parseFloat(current_balance),
    spent_so_far: spentSoFar,
    avg_per_day: avgPerDay,
    days_remaining: daysRemaining,
    predicted_balance: Math.round(predicted_balance),
    status,
    message: messages[status],
    ai_powered: false,
  };

  // ── Gemini Integration DISABLED — Tim AI sudah deploy sendiri ──
  // const geminiService = require('./geminiService');
  // if (geminiService.isConfigured()) {
  //   try {
  //     const categoryTotals = {};
  //     for (const t of rows) {
  //       if (t.transaction_type === 'income') continue;
  //       categoryTotals[t.category] = (categoryTotals[t.category] || 0) + parseFloat(t.amount);
  //     }
  //     
  //     const warning = await geminiService.generateBudgetWarning({
  //       currentBalance: parseFloat(current_balance),
  //       totalIncome,
  //       totalExpense: spentSoFar,
  //       categoryBreakdown: categoryTotals
  //     });
  //     
  //     result.status = warning.status || result.status;
  //     result.message = warning.message || result.message;
  //     result.ai_powered = true;
  //   } catch (err) {
  //     logger.warn('[aiService.predictBalance] Gemini fallback:', err.message);
  //   }
  // }

  await cacheService.set(cacheKey, result, cacheService.TTL.PREDICTION);
  return result;
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
  const cleanDesc = sanitizeText(description);

  // ── Coba panggil AI API ────────────────────────────────────
  try {
    const aiAvailable = await aiClient.isAvailable();

    if (aiAvailable) {
      const aiResult = await aiClient.predictKategori(cleanDesc);

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
    logger.warn('[aiService.predictCategory] AI API fallback:', err.message);
  }

  // ── Fallback: Rule-based keyword matching ───────────────────
  return predictCategoryFallback(cleanDesc || description);
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
 * @param {string} user_id
 */
const getRecommendations = async (user_id) => {
  const cacheKey = cacheService.keys.recommendations(user_id);
  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  const txns = await Transaction.findAll({
    where: {
      user_id,
      date: { [Op.between]: [firstDay, lastDay] },
    },
  });

  const total = txns.reduce((s, t) => s + parseFloat(t.amount), 0);
  if (total === 0) {
    await cacheService.set(cacheKey, GENERAL_RECOMMENDATIONS, cacheService.TTL.RECOMMENDATIONS);
    return GENERAL_RECOMMENDATIONS;
  }

  // Hitung porsi per kategori
  const categoryTotals = {};
  let totalIncome = 0;
  let totalExpense = 0;
  for (const t of txns) {
    const amt = parseFloat(t.amount);
    if (t.transaction_type === 'income') {
      totalIncome += amt;
    } else {
      totalExpense += amt;
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amt;
    }
  }

  // ── Gemini Integration DISABLED — Tim AI sudah deploy sendiri ──
  // const geminiService = require('./geminiService');
  // if (geminiService.isConfigured()) {
  //   try {
  //     const user = await User.findByPk(user_id);
  //     const initialBalance = user ? parseFloat(user.initial_balance) : 0;
  //     const currentBalance = initialBalance + totalIncome - totalExpense;
  //     const income = totalIncome > 0 ? totalIncome : (user ? parseFloat(user.monthly_income) : 5000000);
  //     const savingRatio = income > 0
  //       ? Math.max(0, Math.min(100, ((income - totalExpense) / income) * 100))
  //       : 50;
  //     const dailyMap = {};
  //     for (const t of txns) {
  //       if (t.transaction_type === 'income') continue;
  //       dailyMap[t.date] = (dailyMap[t.date] || 0) + parseFloat(t.amount);
  //     }
  //     const dailyAmounts = Object.values(dailyMap);
  //     let spendingConsistency = 100;
  //     if (dailyAmounts.length > 0) {
  //       const avg = dailyAmounts.reduce((a, b) => a + b, 0) / dailyAmounts.length;
  //       const variance = dailyAmounts.reduce((s, d) => s + Math.pow(d - avg, 2), 0) / dailyAmounts.length;
  //       const cv = avg > 0 ? Math.sqrt(variance) / avg : 0;
  //       spendingConsistency = Math.max(0, Math.min(100, 100 - cv * 50));
  //     }
  //     const categoryDiversity = Math.min(100, (Object.keys(categoryTotals).length / 6) * 100);
  //     const billPayment = categoryTotals['tagihan'] > 0 ? 80 : 50;
  //     const overallScore = Math.round(
  //       savingRatio * 0.35 + spendingConsistency * 0.30 + categoryDiversity * 0.20 + billPayment * 0.15
  //     );
  //     const dynamicRecs = await geminiService.generateRecommendations({
  //       currentBalance,
  //       totalIncome,
  //       totalExpense,
  //       categoryBreakdown: categoryTotals,
  //       healthScore: {
  //         overall: overallScore,
  //         saving_ratio: Math.round(savingRatio),
  //         spending_consistency: Math.round(spendingConsistency),
  //         category_diversity: Math.round(categoryDiversity),
  //         bill_payment: Math.round(billPayment),
  //       },
  //     });
  //     if (dynamicRecs && dynamicRecs.length > 0) {
  //       const result = [...dynamicRecs, ...GENERAL_RECOMMENDATIONS].slice(0, 4);
  //       await cacheService.set(cacheKey, result, cacheService.TTL.RECOMMENDATIONS);
  //       return result;
  //     }
  //   } catch (err) {
  //     logger.warn('[aiService.getRecommendations] Gemini fallback:', err.message);
  //   }
  // }

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
  const result = [...recommendations, ...GENERAL_RECOMMENDATIONS];
  await cacheService.set(cacheKey, result, cacheService.TTL.RECOMMENDATIONS);
  return result;
};

// ─────────────────────────────────────────────────────────────
// 4.  Financial Health Score
// ─────────────────────────────────────────────────────────────

/**
 * Hitung financial health score berdasarkan pola transaksi
 * @param {string} user_id
 */
const getFinancialScore = async (user_id) => {
  const cacheKey = cacheService.keys.financialScore(user_id);
  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  const txns = await Transaction.findAll({
    where: {
      user_id,
      date: { [Op.between]: [firstDay, lastDay] },
    },
  });

  if (txns.length === 0) {
    const result = {
      score: 75,
      level: 'Belum Ada Data',
      breakdown: {
        saving_ratio: 100,
        spending_consistency: 100,
        category_diversity: 0,
        bill_payment: 50,
      },
    };

    await cacheService.set(cacheKey, result, cacheService.TTL.FINANCIAL_SCORE);
    return result;
  }

  // Pisahkan income vs expense untuk financial score
  let totalExpense = 0;
  let totalIncome = 0;
  for (const t of txns) {
    const amount = parseFloat(t.amount);
    if (t.transaction_type === 'income') {
      totalIncome += amount;
    } else {
      totalExpense += amount;
    }
  }
  
  // ── Saving Ratio (Dihitung berdasarkan income riil) ──
  const user = await User.findByPk(user_id);
  const income = totalIncome > 0 ? totalIncome : (user ? parseFloat(user.monthly_income) : 5000000);
  const savingRatio = income > 0 ? Math.max(0, Math.min(100, ((income - totalExpense) / income) * 100)) : 50;

  // ── Spending Consistency (variasi harian) ──
  const dailyMap = {};
  for (const t of txns) {
    if (t.transaction_type === 'income') continue; // Hanya expense
    dailyMap[t.date] = (dailyMap[t.date] || 0) + parseFloat(t.amount);
  }
  const dailyAmounts = Object.values(dailyMap);
  let spendingConsistency = 100;
  if (dailyAmounts.length > 0) {
    const avgDaily = dailyAmounts.reduce((a, b) => a + b, 0) / dailyAmounts.length;
    const variance = dailyAmounts.reduce((sum, d) => sum + Math.pow(d - avgDaily, 2), 0) / dailyAmounts.length;
    const stdDev = Math.sqrt(variance);
    const cv = avgDaily > 0 ? stdDev / avgDaily : 0;
    spendingConsistency = Math.max(0, Math.min(100, 100 - cv * 50));
  }

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

  const result = {
    score,
    level: getLevel(score),
    breakdown: {
      saving_ratio:          Math.round(savingRatio),
      spending_consistency:  Math.round(spendingConsistency),
      category_diversity:    Math.round(categoryDiversity),
      bill_payment:          Math.round(billPayment),
    },
  };

  await cacheService.set(cacheKey, result, cacheService.TTL.FINANCIAL_SCORE);
  return result;
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
