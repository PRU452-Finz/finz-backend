'use strict';

/**
 * AI Service (Mock)
 *
 * Simulasi layanan AI secara rule-based.
 * Kelak dapat diganti dengan panggilan ke external AI API.
 *
 * ⚠️  Semua fungsi di sini adalah MOCK — tidak ada model ML sungguhan.
 */

const { Op } = require('sequelize');
const Transaction = require('../models/Transaction');

// ─────────────────────────────────────────────────────────────
// 1.  Prediksi Saldo Akhir Bulan
// ─────────────────────────────────────────────────────────────

/**
 * Estimasi saldo di akhir bulan berdasarkan rata-rata pengeluaran harian.
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

  // Total pengeluaran bulan berjalan sampai hari ini
  const rows = await Transaction.findAll({
    where: {
      user_id,
      date: { [Op.between]: [firstDay, today] },
    },
  });

  const spentSoFar = rows.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const avgPerDay = daysPassed > 0 ? spentSoFar / daysPassed : 0;
  const projectedAdditional = avgPerDay * daysRemaining;
  const predicted_balance = Math.max(0, current_balance - projectedAdditional);

  // Tentukan status berdasarkan ratio
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
  };
};

// ─────────────────────────────────────────────────────────────
// 2.  Klasifikasi Kategori via Rule-Based
// ─────────────────────────────────────────────────────────────

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

/**
 * Klasifikasi kategori dari deskripsi teks
 * @param {string} description
 * @returns {{ category: string, confidence: string }}
 */
const predictCategory = (description) => {
  if (!description) return { category: 'lainnya', confidence: 'low' };

  const desc = description.toLowerCase().trim();

  for (const rule of CATEGORY_RULES) {
    const matched = rule.keywords.some((kw) => desc.includes(kw));
    if (matched) {
      return {
        category: rule.category,
        confidence: 'high',
        matched_keywords: rule.keywords.filter((kw) => desc.includes(kw)),
      };
    }
  }

  return { category: 'lainnya', confidence: 'low', matched_keywords: [] };
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

  // ── Saving Ratio (simulasi: asumsi pemasukan standar Rp5jt/bulan) ──
  const ASSUMED_INCOME = 5_000_000;
  const savingRatio = Math.max(0, Math.min(100, ((ASSUMED_INCOME - total) / ASSUMED_INCOME) * 100));

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

module.exports = {
  predictBalance,
  predictCategory,
  getRecommendations,
  getFinancialScore,
};
