'use strict';

/**
 * FinZ Database Seeder
 *
 * Menjalankan: node src/database/seeder.js
 *
 * Mengisi tabel `transactions` dengan 25 data dummy yang
 * merepresentasikan pengeluaran realistis seorang mahasiswa Gen-Z.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const sequelize   = require('../config/database');
const Transaction = require('../models/Transaction');

const seedData = [
  // ── April 2026 ────────────────────────────────────────────
  { user_id: 1, amount: 35000,  category: 'makanan',    date: '2026-04-01', payment_method: 'ewallet',  description: 'Makan siang nasi padang' },
  { user_id: 1, amount: 15000,  category: 'transport',  date: '2026-04-01', payment_method: 'ewallet',  description: 'Gojek ke kampus' },
  { user_id: 1, amount: 120000, category: 'belanja',    date: '2026-04-02', payment_method: 'debit',    description: 'Beli baju di Uniqlo' },
  { user_id: 1, amount: 50000,  category: 'hiburan',    date: '2026-04-02', payment_method: 'ewallet',  description: 'Nonton bioskop' },
  { user_id: 1, amount: 25000,  category: 'makanan',    date: '2026-04-03', payment_method: 'cash',     description: 'Kopi di Starbucks' },
  { user_id: 1, amount: 200000, category: 'tagihan',    date: '2026-04-03', payment_method: 'transfer', description: 'Bayar kuota internet bulanan' },
  { user_id: 1, amount: 45000,  category: 'makanan',    date: '2026-04-04', payment_method: 'qris',     description: 'Makan malam di warteg' },
  { user_id: 1, amount: 12000,  category: 'transport',  date: '2026-04-04', payment_method: 'ewallet',  description: 'Grab ke mall' },
  { user_id: 1, amount: 350000, category: 'pendidikan', date: '2026-04-05', payment_method: 'transfer', description: 'Beli buku kuliah semester ini' },
  { user_id: 1, amount: 75000,  category: 'hiburan',    date: '2026-04-05', payment_method: 'ewallet',  description: 'Langganan Spotify Premium' },
  { user_id: 1, amount: 28000,  category: 'makanan',    date: '2026-04-06', payment_method: 'cash',     description: 'Beli makan di kantin kampus' },
  { user_id: 1, amount: 150000, category: 'kesehatan',  date: '2026-04-06', payment_method: 'debit',    description: 'Beli vitamin dan obat' },
  { user_id: 1, amount: 85000,  category: 'belanja',    date: '2026-04-07', payment_method: 'ewallet',  description: 'Belanja skincare di Sociolla' },
  { user_id: 1, amount: 20000,  category: 'transport',  date: '2026-04-07', payment_method: 'ewallet',  description: 'Gojek pulang dari gym' },
  { user_id: 1, amount: 55000,  category: 'makanan',    date: '2026-04-08', payment_method: 'qris',     description: 'Makan sushi di resto Jepang' },
  { user_id: 1, amount: 100000, category: 'hiburan',    date: '2026-04-08', payment_method: 'debit',    description: 'Top up game Mobile Legends' },
  { user_id: 1, amount: 40000,  category: 'makanan',    date: '2026-04-09', payment_method: 'cash',     description: 'Beli bakso dan es teh' },
  { user_id: 1, amount: 300000, category: 'tagihan',    date: '2026-04-09', payment_method: 'transfer', description: 'Bayar listrik kosan' },
  { user_id: 1, amount: 180000, category: 'belanja',    date: '2026-04-10', payment_method: 'credit',   description: 'Beli case HP dan aksesoris' },
  { user_id: 1, amount: 22000,  category: 'transport',  date: '2026-04-10', payment_method: 'ewallet',  description: 'Naik Grab ke stasiun' },
  { user_id: 1, amount: 65000,  category: 'makanan',    date: '2026-04-11', payment_method: 'qris',     description: 'Dinner di McDonalds' },
  { user_id: 1, amount: 30000,  category: 'lainnya',    date: '2026-04-11', payment_method: 'cash',     description: 'Fotocopy tugas kuliah' },
  { user_id: 1, amount: 250000, category: 'belanja',    date: '2026-04-12', payment_method: 'ewallet',  description: 'Beli earbuds di Tokopedia' },
  { user_id: 1, amount: 18000,  category: 'makanan',    date: '2026-04-12', payment_method: 'cash',     description: 'Sarapan bubur ayam' },
  { user_id: 1, amount: 90000,  category: 'kesehatan',  date: '2026-04-13', payment_method: 'debit',    description: 'Gym membership mingguan' },
  // ── Maret 2026 (data bulan lalu untuk monthly chart) ──────
  { user_id: 1, amount: 450000, category: 'belanja',    date: '2026-03-15', payment_method: 'credit',   description: 'Belanja bulanan di supermarket' },
  { user_id: 1, amount: 200000, category: 'tagihan',    date: '2026-03-10', payment_method: 'transfer', description: 'Bayar listrik Maret' },
  { user_id: 1, amount: 150000, category: 'makanan',    date: '2026-03-20', payment_method: 'ewallet',  description: 'Makan bersama teman' },
  // ── Februari 2026 ─────────────────────────────────────────
  { user_id: 1, amount: 500000, category: 'pendidikan', date: '2026-02-01', payment_method: 'transfer', description: 'Bayar UKT semester genap' },
  { user_id: 1, amount: 250000, category: 'tagihan',    date: '2026-02-10', payment_method: 'transfer', description: 'Bayar listrik Februari' },
];

async function runSeeder() {
  try {
    console.log('🌱  Connecting to database...');
    await sequelize.authenticate();

    console.log('🌱  Syncing models...');
    await sequelize.sync({ alter: true });

    console.log('🌱  Clearing existing transactions...');
    await Transaction.destroy({ where: {}, truncate: true });

    console.log(`🌱  Inserting ${seedData.length} transactions...`);

    for (const row of seedData) {
      await Transaction.create({
        ...row,
        created_at: new Date(`${row.date}T08:00:00`),
      });
    }

    console.log(`✅  Seeder berhasil! ${seedData.length} transaksi ditambahkan.`);
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('❌  Seeder gagal:', err.message);
    console.error(err);
    process.exit(1);
  }
}

runSeeder();
