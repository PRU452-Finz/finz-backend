'use strict';

const logger = require('../config/logger');

require('dotenv').config(); // Load ENV sebelum memanggil model
const { User, Transaction, Budget } = require('../models');
const bcrypt = require('bcryptjs');

/**
 * Custom Seeder untuk 4 Profil User Berbeda (Mei 2026)
 * 
 * 1. Junardi: Karyawan, Hemat (Status: Sangat Sehat)
 * 2. Ashley: Mahasiswa, Impulsif Belanja & Hiburan (Status: Bahaya/Tidak Sehat)
 * 3. Cindy: Freelancer, Fokus Investasi & Kesehatan (Status: Cukup Sehat)
 * 4. Zulhan: Wirausaha, High Income, High Spending (Status: Warning / Perlu Perbaikan)
 */

async function customSeed() {
  try {
    logger.info('--- Memulai Custom Seeding (Junardi, Ashley, Cindy, Zulhan) ---');

    const emails = ['junardi@finz.id', 'ashley@finz.id', 'cindy@finz.id', 'zulhan@finz.id'];
    
    // Cari user yang sudah ada
    const existingUsers = await User.findAll({ where: { email: emails } });
    const existingUserIds = existingUsers.map(u => u.id);

    // Hapus data terkait (Transaction & Budget) untuk user tersebut agar tidak duplikat data transaksinya
    if (existingUserIds.length > 0) {
      await Transaction.destroy({ where: { user_id: existingUserIds } });
      await Budget.destroy({ where: { user_id: existingUserIds } });
      await User.destroy({ where: { id: existingUserIds } });
      logger.info('Data lama untuk profil target telah dibersihkan.');
    }

    const bulanMei = '2026-05';

    // ─────────────────────────────────────────────────────────────
    // 1. JUNARDI (Si Hemat & Teratur)
    // ─────────────────────────────────────────────────────────────
    const junardi = await User.create({
      name: 'Junardi',
      email: 'junardi@finz.id',
      password: 'password123', // Akan di-hash otomatis via hook model User
      monthly_income: 8000000,
      age: 26,
      occupation: 'karyawan',
      financial_goal: 'hemat',
      risk_profile: 'konservatif'
    });

    await Budget.bulkCreate([
      { user_id: junardi.id, category: 'makanan', limit_amount: 1500000, month: bulanMei },
      { user_id: junardi.id, category: 'transport', limit_amount: 500000, month: bulanMei },
      { user_id: junardi.id, category: 'tagihan', limit_amount: 1000000, month: bulanMei }
    ]);

    await Transaction.bulkCreate([
      { user_id: junardi.id, amount: 8000000, category: 'gaji', transaction_type: 'income', date: '2026-05-01', description: 'Gaji Bulanan' },
      { user_id: junardi.id, amount: 50000, category: 'makanan', transaction_type: 'expense', date: '2026-05-02', description: 'Makan Siang Murah' },
      { user_id: junardi.id, amount: 200000, category: 'tagihan', transaction_type: 'expense', date: '2026-05-05', description: 'Listrik' },
      { user_id: junardi.id, amount: 100000, category: 'transport', transaction_type: 'expense', date: '2026-05-10', description: 'Bensin' }
    ]);

    // ─────────────────────────────────────────────────────────────
    // 2. ASHLEY (Si Impulsif - Gen-Z FOMO)
    // ─────────────────────────────────────────────────────────────
    const ashley = await User.create({
      name: 'Ashley',
      email: 'ashley@finz.id',
      password: 'password123',
      monthly_income: 2500000,
      age: 20,
      occupation: 'mahasiswa',
      financial_goal: 'hemat',
      risk_profile: 'moderat'
    });

    await Budget.bulkCreate([
      { user_id: ashley.id, category: 'makanan', limit_amount: 800000, month: bulanMei },
      { user_id: ashley.id, category: 'hiburan', limit_amount: 500000, month: bulanMei },
      { user_id: ashley.id, category: 'belanja', limit_amount: 500000, month: bulanMei }
    ]);

    await Transaction.bulkCreate([
      { user_id: ashley.id, amount: 2500000, category: 'pemasukan', transaction_type: 'income', date: '2026-05-01', description: 'Uang Saku' },
      { user_id: ashley.id, amount: 750000, category: 'hiburan', transaction_type: 'expense', date: '2026-05-05', description: 'Konser Musik (Overbudget)' },
      { user_id: ashley.id, amount: 1200000, category: 'belanja', transaction_type: 'expense', date: '2026-05-12', description: 'Sepatu Baru (Overbudget)' },
      { user_id: ashley.id, amount: 400000, category: 'makanan', transaction_type: 'expense', date: '2026-05-15', description: 'Nongkrong Cafe' }
    ]);
    // Status Ashley akan sangat 'Bahaya' karena pengeluaran > income

    // ─────────────────────────────────────────────────────────────
    // 3. CINDY (Si Freelancer - Fokus Wellness & Investasi)
    // ─────────────────────────────────────────────────────────────
    const cindy = await User.create({
      name: 'Cindy',
      email: 'cindy@finz.id',
      password: 'password123',
      monthly_income: 12000000,
      age: 24,
      occupation: 'freelancer',
      financial_goal: 'investasi',
      risk_profile: 'agresif'
    });

    await Budget.bulkCreate([
      { user_id: cindy.id, category: 'makanan', limit_amount: 3000000, month: bulanMei },
      { user_id: cindy.id, category: 'lainnya', limit_amount: 4000000, month: bulanMei }, // ENUM tidak mendukung 'investasi'
      { user_id: cindy.id, category: 'kesehatan', limit_amount: 1500000, month: bulanMei }
    ]);

    await Transaction.bulkCreate([
      { user_id: cindy.id, amount: 12000000, category: 'gaji', transaction_type: 'income', date: '2026-05-01', description: 'Project Web Development' },
      { user_id: cindy.id, amount: 5000000, category: 'lainnya', transaction_type: 'expense', date: '2026-05-03', description: 'Beli Saham' },
      { user_id: cindy.id, amount: 800000, category: 'kesehatan', transaction_type: 'expense', date: '2026-05-08', description: 'Check-up & Vitamin' },
      { user_id: cindy.id, amount: 150000, category: 'makanan', transaction_type: 'expense', date: '2026-05-12', description: 'Salad & Healthy Food' }
    ]);

    // ─────────────────────────────────────────────────────────────
    // 4. ZULHAN (Si Wirausaha - High Lifestyle)
    // ─────────────────────────────────────────────────────────────
    const zulhan = await User.create({
      name: 'Zulhan',
      email: 'zulhan@finz.id',
      password: 'password123',
      monthly_income: 25000000,
      age: 27,
      occupation: 'wirausaha',
      financial_goal: 'dana_darurat',
      risk_profile: 'moderat'
    });

    await Budget.bulkCreate([
      { user_id: zulhan.id, category: 'makanan', limit_amount: 5000000, month: bulanMei },
      { user_id: zulhan.id, category: 'transport', limit_amount: 3000000, month: bulanMei },
      { user_id: zulhan.id, category: 'hiburan', limit_amount: 5000000, month: bulanMei }
    ]);

    await Transaction.bulkCreate([
      { user_id: zulhan.id, amount: 25000000, category: 'pemasukan', transaction_type: 'income', date: '2026-05-01', description: 'Profit Bisnis Coffee Shop' },
      { user_id: zulhan.id, amount: 4000000, category: 'hiburan', transaction_type: 'expense', date: '2026-05-05', description: 'Party & Karaoke' },
      { user_id: zulhan.id, amount: 6000000, category: 'makanan', transaction_type: 'expense', date: '2026-05-10', description: 'Fine Dining Bisnis (Over Limit)' },
      { user_id: zulhan.id, amount: 2500000, category: 'transport', transaction_type: 'expense', date: '2026-05-14', description: 'Servis Mobil' }
    ]);

    logger.info('--- Custom Seeding SELESAI ---');
    logger.info('Email login semua: user@finz.id | Password: password123');
    process.exit(0);

  } catch (err) {
    logger.error('FAILED Custom Seeding:', err);
    process.exit(1);
  }
}

customSeed();