'use strict';

/**
 * Chat Controller
 *
 * POST /api/chat/ask
 * Menerima pesan user, mengambil konteks keuangan real-time,
 * lalu mengirimkannya ke AI API (HuggingFace) sebagai penasihat keuangan personal.
 *
 * Sebelumnya: langsung ke Gemini via geminiService
 * Sekarang:   proxy ke HuggingFace /chat (tim AI sudah deploy Gemini di sana)
 */

const logger = require('../config/logger');
const { Op } = require('sequelize');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const aiClient = require('../services/aiClient');

// ─── Content Moderation ─────────────────────────────────────
// Kata-kata yang tidak pantas / di luar konteks keuangan
const BLOCKED_KEYWORDS = [
  'bokep', 'porn', 'xxx', 'seks', 'ngewe', 'ngentot', 'memek',
  'kontol', 'pepek', 'colmek', 'coli', 'onani', 'masturbasi',
  'hentai', 'jav', 'xnxx', 'xvideos', 'brazzers',
  'bunuh', 'bom', 'terorisme', 'narkoba', 'ganja', 'sabu',
  'judi online', 'slot gacor',
];

const MODERATION_RESPONSE = 'Maaf, saya hanya bisa membantu pertanyaan seputar keuangan dan finansial. ' +
  'Silakan tanyakan hal-hal seperti tips menabung, analisis pengeluaran, saran investasi, atau perencanaan budget kamu. 😊';

/**
 * Cek apakah pesan mengandung konten yang tidak pantas
 */
const isInappropriate = (text) => {
  const lower = text.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  return BLOCKED_KEYWORDS.some(kw => lower.includes(kw));
};

/**
 * Cek apakah respon AI mengandung error dari upstream (Gemini safety block)
 */
const isUpstreamError = (jawaban) => {
  if (!jawaban || typeof jawaban !== 'string') return true;
  const errorPatterns = [
    'error saat menghubungi gemini',
    "'candidates'",
    'terjadi error',
    'SAFETY',
    'blocked',
    'content filtered',
  ];
  const lower = jawaban.toLowerCase();
  return errorPatterns.some(p => lower.includes(p.toLowerCase()));
};

const askChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(422).json({ success: false, message: 'Pesan tidak boleh kosong.' });
    }

    // ─── Filter konten tidak pantas di backend ───────────────
    if (isInappropriate(message)) {
      return res.status(200).json({
        success: true,
        data: {
          reply: MODERATION_RESPONSE,
          context_used: false,
          moderated: true,
        },
      });
    }

    // ─── Ambil konteks keuangan user bulan ini ───────────────
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const lastDay  = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

    const [user, transactions] = await Promise.all([
      User.findByPk(userId, { attributes: ['name', 'initial_balance', 'monthly_income'] }),
      Transaction.findAll({
        where: { user_id: userId, date: { [Op.between]: [firstDay, lastDay] } },
        order: [['date', 'DESC']],
      }),
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals = {};

    for (const t of transactions) {
      const amount = parseFloat(t.amount);
      if (t.transaction_type === 'income') {
        totalIncome += amount;
      } else {
        totalExpense += amount;
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amount;
      }
    }

    const saldoAwal = user ? parseFloat(user.initial_balance) : 0;

    // ─── Kirim ke HuggingFace /chat ──────────────────────────
    const payload = {
      pertanyaan: message.trim(),
      user_id: String(userId),
      data_keuangan: {
        total_income: totalIncome,
        total_pengeluaran: totalExpense,
        saldo_awal: saldoAwal,
        pengeluaran_per_kategori: categoryTotals,
      },
      riwayat_chat: history.map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        content: h.content,
      })),
    };

    const aiResult = await aiClient.chatAsk(payload);

    // ─── Tangkap error upstream dari Gemini (safety block) ───
    if (isUpstreamError(aiResult.jawaban)) {
      logger.warn(`[ChatController] Upstream Gemini blocked content for user ${userId}: "${message.substring(0, 50)}"`);
      return res.status(200).json({
        success: true,
        data: {
          reply: MODERATION_RESPONSE,
          context_used: false,
          moderated: true,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        reply: aiResult.jawaban,
        context_used: true,
        latency_ms: aiResult.latency_ms,
      },
    });
  } catch (err) {
    logger.error('[ChatController.askChat]', err);

    // Jika AI API tidak tersedia
    if (err.code === 'ECONNREFUSED' || err.code === 'ECONNABORTED') {
      return res.status(503).json({
        success: false,
        message: 'Fitur AI Chat sedang tidak tersedia. Coba lagi nanti.',
      });
    }

    return res.status(500).json({ success: false, message: 'Gagal mendapatkan respons dari AI.' });
  }
};

module.exports = { askChat };
