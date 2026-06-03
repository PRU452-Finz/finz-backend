'use strict';

const logger = require('../config/logger');

require('dotenv').config(); // Load ENV sebelum memanggil model
const { User, Transaction, Budget } = require('../models');
const bcrypt = require('bcryptjs');

/**
 * Custom Seeder untuk 4 Profil User Berbeda (Mei + Juni 2026)
 *
 * 1. Junardi: Karyawan, Hemat (Status: Sangat Sehat)
 * 2. Ashley:  Mahasiswa, Impulsif Belanja & Hiburan (Status: Bahaya/Tidak Sehat)
 * 3. Cindy:   Freelancer, Fokus Investasi & Kesehatan (Status: Cukup Sehat)
 * 4. Zulhan:  Wirausaha, High Income, High Spending (Status: Warning / Perlu Perbaikan)
 */

async function customSeed() {
  try {
    logger.info('--- Memulai Custom Seeding (Junardi, Ashley, Cindy, Zulhan) ---');

    const emails = ['junardi@finz.id', 'ashley@finz.id', 'cindy@finz.id', 'zulhan@finz.id'];

    // Cari user yang sudah ada
    const existingUsers = await User.findAll({ where: { email: emails } });
    const existingUserIds = existingUsers.map(u => u.id);

    // Hapus data terkait (Transaction & Budget) agar tidak duplikat
    if (existingUserIds.length > 0) {
      await Transaction.destroy({ where: { user_id: existingUserIds } });
      await Budget.destroy({ where: { user_id: existingUserIds } });
      await User.destroy({ where: { id: existingUserIds } });
      logger.info('Data lama untuk profil target telah dibersihkan.');
    }

    const bulanMei  = '2026-05';
    const bulanJuni = '2026-06';

    // ─────────────────────────────────────────────────────────────
    // 1. JUNARDI (Si Hemat & Teratur)
    // ─────────────────────────────────────────────────────────────
    const junardi = await User.create({
      name: 'Junardi',
      email: 'junardi@finz.id',
      password: 'password123',
      monthly_income: 8000000,
      age: 26,
      occupation: 'karyawan',
      financial_goal: 'hemat',
      risk_profile: 'konservatif',
    });

    await Budget.bulkCreate([
      // Mei
      { user_id: junardi.id, category: 'makanan',   limit_amount: 1500000, month: bulanMei },
      { user_id: junardi.id, category: 'transport',  limit_amount:  500000, month: bulanMei },
      { user_id: junardi.id, category: 'tagihan',    limit_amount: 1000000, month: bulanMei },
      // Juni
      { user_id: junardi.id, category: 'makanan',   limit_amount: 1500000, month: bulanJuni },
      { user_id: junardi.id, category: 'transport',  limit_amount:  500000, month: bulanJuni },
      { user_id: junardi.id, category: 'tagihan',    limit_amount: 1000000, month: bulanJuni },
    ]);

    await Transaction.bulkCreate([
      // ── Mei ─────────────────────────────────────────────
      { user_id: junardi.id, amount: 8000000, category: 'gaji',      transaction_type: 'income',  date: '2026-05-01', description: 'Gaji Bulanan', payment_method: 'transfer' },
      { user_id: junardi.id, amount:   50000, category: 'makanan',   transaction_type: 'expense', date: '2026-05-02', description: 'Makan Siang Nasi Padang', payment_method: 'cash' },
      { user_id: junardi.id, amount:  200000, category: 'tagihan',   transaction_type: 'expense', date: '2026-05-05', description: 'Bayar Listrik PLN', payment_method: 'transfer' },
      { user_id: junardi.id, amount:  100000, category: 'transport', transaction_type: 'expense', date: '2026-05-10', description: 'Isi Bensin', payment_method: 'ewallet' },
      { user_id: junardi.id, amount:   35000, category: 'makanan',   transaction_type: 'expense', date: '2026-05-14', description: 'Sarapan Bubur Ayam', payment_method: 'cash' },
      { user_id: junardi.id, amount:  150000, category: 'tagihan',   transaction_type: 'expense', date: '2026-05-17', description: 'Bayar WIFI Indihome', payment_method: 'transfer' },
      { user_id: junardi.id, amount:   75000, category: 'makanan',   transaction_type: 'expense', date: '2026-05-20', description: 'Makan Malam Warteg', payment_method: 'cash' },
      { user_id: junardi.id, amount:   80000, category: 'transport', transaction_type: 'expense', date: '2026-05-25', description: 'Parkir & Tol', payment_method: 'ewallet' },
      { user_id: junardi.id, amount:   60000, category: 'makanan',   transaction_type: 'expense', date: '2026-05-28', description: 'GoFood Sarapan', payment_method: 'ewallet' },

      // ── Juni ─────────────────────────────────────────────
      { user_id: junardi.id, amount: 8000000, category: 'gaji',      transaction_type: 'income',  date: '2026-06-01', description: 'Gaji Bulanan Juni', payment_method: 'transfer' },
      { user_id: junardi.id, amount:   45000, category: 'makanan',   transaction_type: 'expense', date: '2026-06-01', description: 'Sarapan Nasi Uduk', payment_method: 'cash' },
      { user_id: junardi.id, amount:  200000, category: 'tagihan',   transaction_type: 'expense', date: '2026-06-02', description: 'Bayar Listrik Juni', payment_method: 'transfer' },
      { user_id: junardi.id, amount:   55000, category: 'makanan',   transaction_type: 'expense', date: '2026-06-03', description: 'Makan Siang Warteg', payment_method: 'cash' },
      { user_id: junardi.id, amount:  120000, category: 'transport', transaction_type: 'expense', date: '2026-06-03', description: 'Isi Bensin Full Tank', payment_method: 'ewallet' },
    ]);

    logger.info('✅ Junardi selesai di-seed (Mei + Juni 2026)');

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
      risk_profile: 'moderat',
    });

    await Budget.bulkCreate([
      // Mei
      { user_id: ashley.id, category: 'makanan',  limit_amount:  800000, month: bulanMei },
      { user_id: ashley.id, category: 'hiburan',  limit_amount:  500000, month: bulanMei },
      { user_id: ashley.id, category: 'belanja',  limit_amount:  500000, month: bulanMei },
      // Juni
      { user_id: ashley.id, category: 'makanan',  limit_amount:  800000, month: bulanJuni },
      { user_id: ashley.id, category: 'hiburan',  limit_amount:  500000, month: bulanJuni },
      { user_id: ashley.id, category: 'belanja',  limit_amount:  500000, month: bulanJuni },
    ]);

    await Transaction.bulkCreate([
      // ── Mei ─────────────────────────────────────────────
      { user_id: ashley.id, amount: 2500000, category: 'pemasukan', transaction_type: 'income',  date: '2026-05-01', description: 'Uang Saku Bulanan', payment_method: 'transfer' },
      { user_id: ashley.id, amount:  750000, category: 'hiburan',   transaction_type: 'expense', date: '2026-05-05', description: 'Konser Musik (Overbudget)', payment_method: 'ewallet' },
      { user_id: ashley.id, amount:  200000, category: 'makanan',   transaction_type: 'expense', date: '2026-05-08', description: 'Date ke Kafe Aesthetic', payment_method: 'ewallet' },
      { user_id: ashley.id, amount: 1200000, category: 'belanja',   transaction_type: 'expense', date: '2026-05-12', description: 'Sepatu Baru di Shopee', payment_method: 'ewallet' },
      { user_id: ashley.id, amount:  400000, category: 'makanan',   transaction_type: 'expense', date: '2026-05-15', description: 'Nongkrong Kafe', payment_method: 'ewallet' },
      { user_id: ashley.id, amount:  350000, category: 'hiburan',   transaction_type: 'expense', date: '2026-05-20', description: 'Top Up Mobile Legends', payment_method: 'ewallet' },
      { user_id: ashley.id, amount:  180000, category: 'belanja',   transaction_type: 'expense', date: '2026-05-25', description: 'Skincare Baru Tokopedia', payment_method: 'ewallet' },
      { user_id: ashley.id, amount:  250000, category: 'makanan',   transaction_type: 'expense', date: '2026-05-28', description: 'Gofood Late Night', payment_method: 'ewallet' },

      // ── Juni ─────────────────────────────────────────────
      { user_id: ashley.id, amount: 2500000, category: 'pemasukan', transaction_type: 'income',  date: '2026-06-01', description: 'Uang Saku Bulanan Juni', payment_method: 'transfer' },
      { user_id: ashley.id, amount:  550000, category: 'belanja',   transaction_type: 'expense', date: '2026-06-01', description: 'Beli Baju Diskon Harbolnas', payment_method: 'ewallet' },
      { user_id: ashley.id, amount:  180000, category: 'makanan',   transaction_type: 'expense', date: '2026-06-02', description: 'Brunch Weekend Kafe Instagrammable', payment_method: 'ewallet' },
      { user_id: ashley.id, amount:  320000, category: 'hiburan',   transaction_type: 'expense', date: '2026-06-02', description: 'Nonton Bioskop + Popcorn', payment_method: 'ewallet' },
      { user_id: ashley.id, amount:  210000, category: 'makanan',   transaction_type: 'expense', date: '2026-06-03', description: 'Boba + Dessert Bestie', payment_method: 'ewallet' },
    ]);

    logger.info('✅ Ashley selesai di-seed (Mei + Juni 2026)');

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
      risk_profile: 'agresif',
    });

    await Budget.bulkCreate([
      // Mei
      { user_id: cindy.id, category: 'makanan',   limit_amount: 3000000, month: bulanMei },
      { user_id: cindy.id, category: 'lainnya',   limit_amount: 4000000, month: bulanMei },
      { user_id: cindy.id, category: 'kesehatan', limit_amount: 1500000, month: bulanMei },
      // Juni
      { user_id: cindy.id, category: 'makanan',   limit_amount: 3000000, month: bulanJuni },
      { user_id: cindy.id, category: 'lainnya',   limit_amount: 4000000, month: bulanJuni },
      { user_id: cindy.id, category: 'kesehatan', limit_amount: 1500000, month: bulanJuni },
    ]);

    await Transaction.bulkCreate([
      // ── Mei ─────────────────────────────────────────────
      { user_id: cindy.id, amount: 12000000, category: 'gaji',      transaction_type: 'income',  date: '2026-05-01', description: 'Project Web Development Client A', payment_method: 'transfer' },
      { user_id: cindy.id, amount:  5000000, category: 'lainnya',   transaction_type: 'expense', date: '2026-05-03', description: 'Investasi Reksa Dana', payment_method: 'transfer' },
      { user_id: cindy.id, amount:   800000, category: 'kesehatan', transaction_type: 'expense', date: '2026-05-08', description: 'Check-up Tahunan & Vitamin', payment_method: 'transfer' },
      { user_id: cindy.id, amount:   150000, category: 'makanan',   transaction_type: 'expense', date: '2026-05-12', description: 'Salad Bar Sehat', payment_method: 'ewallet' },
      { user_id: cindy.id, amount:  3000000, category: 'gaji',      transaction_type: 'income',  date: '2026-05-15', description: 'Freelance UI/UX Design', payment_method: 'transfer' },
      { user_id: cindy.id, amount:   600000, category: 'kesehatan', transaction_type: 'expense', date: '2026-05-18', description: 'Gym Membership Bulanan', payment_method: 'ewallet' },
      { user_id: cindy.id, amount:   200000, category: 'makanan',   transaction_type: 'expense', date: '2026-05-20', description: 'Smoothie Bowl & Kopi Specialty', payment_method: 'ewallet' },
      { user_id: cindy.id, amount:   350000, category: 'makanan',   transaction_type: 'expense', date: '2026-05-24', description: 'Weekly Grocery Organik', payment_method: 'ewallet' },
      { user_id: cindy.id, amount:   400000, category: 'pendidikan',transaction_type: 'expense', date: '2026-05-28', description: 'Kursus Online Figma Advanced', payment_method: 'ewallet' },

      // ── Juni ─────────────────────────────────────────────
      { user_id: cindy.id, amount: 15000000, category: 'gaji',      transaction_type: 'income',  date: '2026-06-01', description: 'Project Besar E-Commerce Client B', payment_method: 'transfer' },
      { user_id: cindy.id, amount:  5000000, category: 'lainnya',   transaction_type: 'expense', date: '2026-06-01', description: 'Investasi Saham BBCA', payment_method: 'transfer' },
      { user_id: cindy.id, amount:   600000, category: 'kesehatan', transaction_type: 'expense', date: '2026-06-02', description: 'Gym Membership & Suplemen', payment_method: 'ewallet' },
      { user_id: cindy.id, amount:   180000, category: 'makanan',   transaction_type: 'expense', date: '2026-06-02', description: 'Acai Bowl & Jus Segar', payment_method: 'ewallet' },
      { user_id: cindy.id, amount:   250000, category: 'makanan',   transaction_type: 'expense', date: '2026-06-03', description: 'Dinner Sehat Japanese Food', payment_method: 'ewallet' },
    ]);

    logger.info('✅ Cindy selesai di-seed (Mei + Juni 2026)');

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
      risk_profile: 'moderat',
    });

    await Budget.bulkCreate([
      // Mei
      { user_id: zulhan.id, category: 'makanan',   limit_amount:  5000000, month: bulanMei },
      { user_id: zulhan.id, category: 'transport',  limit_amount:  3000000, month: bulanMei },
      { user_id: zulhan.id, category: 'hiburan',    limit_amount:  5000000, month: bulanMei },
      // Juni
      { user_id: zulhan.id, category: 'makanan',   limit_amount:  5000000, month: bulanJuni },
      { user_id: zulhan.id, category: 'transport',  limit_amount:  3000000, month: bulanJuni },
      { user_id: zulhan.id, category: 'hiburan',    limit_amount:  5000000, month: bulanJuni },
    ]);

    await Transaction.bulkCreate([
      // ── Mei ─────────────────────────────────────────────
      { user_id: zulhan.id, amount: 25000000, category: 'pemasukan', transaction_type: 'income',  date: '2026-05-01', description: 'Profit Bisnis Coffee Shop', payment_method: 'transfer' },
      { user_id: zulhan.id, amount:  4000000, category: 'hiburan',   transaction_type: 'expense', date: '2026-05-05', description: 'Party & Karaoke VIP', payment_method: 'ewallet' },
      { user_id: zulhan.id, amount:  6000000, category: 'makanan',   transaction_type: 'expense', date: '2026-05-10', description: 'Fine Dining Bisnis (Over Limit)', payment_method: 'credit' },
      { user_id: zulhan.id, amount:  2500000, category: 'transport', transaction_type: 'expense', date: '2026-05-14', description: 'Servis Rutin Mobil', payment_method: 'transfer' },
      { user_id: zulhan.id, amount:  5000000, category: 'hiburan',   transaction_type: 'expense', date: '2026-05-18', description: 'Liburan Weekend ke Bandung', payment_method: 'credit' },
      { user_id: zulhan.id, amount:  1500000, category: 'makanan',   transaction_type: 'expense', date: '2026-05-22', description: 'Makan Tim Kantor (Treat)', payment_method: 'ewallet' },
      { user_id: zulhan.id, amount:  3000000, category: 'transport', transaction_type: 'expense', date: '2026-05-26', description: 'Bensin + Tol Perjalanan Bisnis', payment_method: 'ewallet' },
      { user_id: zulhan.id, amount:  2000000, category: 'belanja',   transaction_type: 'expense', date: '2026-05-29', description: 'Sepatu Kulit Branded', payment_method: 'credit' },

      // ── Juni ─────────────────────────────────────────────
      { user_id: zulhan.id, amount: 30000000, category: 'pemasukan', transaction_type: 'income',  date: '2026-06-01', description: 'Profit Bisnis Juni + Bonus Kontrak', payment_method: 'transfer' },
      { user_id: zulhan.id, amount:  3500000, category: 'hiburan',   transaction_type: 'expense', date: '2026-06-01', description: 'Dinner VIP Rekan Bisnis', payment_method: 'credit' },
      { user_id: zulhan.id, amount:  4500000, category: 'makanan',   transaction_type: 'expense', date: '2026-06-02', description: 'Catering Meeting Bulanan', payment_method: 'transfer' },
      { user_id: zulhan.id, amount:  1800000, category: 'transport', transaction_type: 'expense', date: '2026-06-02', description: 'Bensin + Parkir Mal Premium', payment_method: 'ewallet' },
      { user_id: zulhan.id, amount:  2200000, category: 'belanja',   transaction_type: 'expense', date: '2026-06-03', description: 'Jam Tangan Baru (Treat Diri)', payment_method: 'credit' },
    ]);

    logger.info('✅ Zulhan selesai di-seed (Mei + Juni 2026)');

    logger.info('');
    logger.info('╔══════════════════════════════════════════════════════╗');
    logger.info('║         CUSTOM SEEDING SELESAI (Mei + Juni 2026)    ║');
    logger.info('╠══════════════════════════════════════════════════════╣');
    logger.info('║  junardi@finz.id  │ password123  │ Karyawan Hemat   ║');
    logger.info('║  ashley@finz.id   │ password123  │ Mahasiswa Impuls ║');
    logger.info('║  cindy@finz.id    │ password123  │ Freelancer Sehat ║');
    logger.info('║  zulhan@finz.id   │ password123  │ Wirausaha Mewah  ║');
    logger.info('╚══════════════════════════════════════════════════════╝');
    process.exit(0);

  } catch (err) {
    logger.error('FAILED Custom Seeding:', err);
    process.exit(1);
  }
}

customSeed();