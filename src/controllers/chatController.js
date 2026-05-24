'use strict';

/**
 * Chat Controller
 *
 * POST /api/chat/ask
 * Menerima pesan user, mengambil konteks keuangan real-time,
 * lalu mengirimkannya ke Gemini sebagai penasihat keuangan personal.
 */

const logger = require('../config/logger');
const { Op } = require('sequelize');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const geminiService = require('../services/geminiService');

const askChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(422).json({ success: false, message: 'Pesan tidak boleh kosong.' });
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

    const currentBalance = (user ? parseFloat(user.initial_balance) : 0) + totalIncome - totalExpense;

    // Top 3 kategori pengeluaran
    const topCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cat, amt]) => `${cat}: Rp ${amt.toLocaleString('id-ID')}`)
      .join(', ');

    const financialContext = `
Nama user: ${user?.name || 'Pengguna'}
Bulan: ${now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
Saldo saat ini: Rp ${currentBalance.toLocaleString('id-ID')}
Total pemasukan bulan ini: Rp ${totalIncome.toLocaleString('id-ID')}
Total pengeluaran bulan ini: Rp ${totalExpense.toLocaleString('id-ID')}
Top 3 kategori pengeluaran: ${topCategories || 'Belum ada transaksi bulan ini'}
Jumlah transaksi: ${transactions.length}
`.trim();

    const reply = await geminiService.generateChatResponse(message.trim(), history, financialContext);

    return res.status(200).json({
      success: true,
      data: { reply, context_used: true },
    });
  } catch (err) {
    logger.error('[ChatController.askChat]', err);

    // Jika Gemini belum dikonfigurasi
    if (err.message?.includes('GEMINI_API_KEY')) {
      return res.status(503).json({
        success: false,
        message: 'Fitur AI Chat belum dikonfigurasi. Hubungi administrator.',
      });
    }

    return res.status(500).json({ success: false, message: 'Gagal mendapatkan respons dari AI.' });
  }
};

module.exports = { askChat };
