'use strict';

/**
 * FinZ Database Seeder
 *
 * Menjalankan: node src/database/seeder.js
 *
 * Mengisi tabel `users` dengan 1 user default (mahasiswa Gen-Z)
 * dan tabel `transactions` dengan 30 data dummy yang realistis.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { sequelize, User, Transaction, Budget } = require('../models');

// ── Default User ─────────────────────────────────────────────
const defaultUser = {
  name: 'Bayu Aji',
  email: 'bayu@finz.id',
  // Hash bcrypt dari password "finz1234" (10 rounds)
  password: '$2b$10$T/lyejLYSJb.7xh1zmGPq.rWdKFho3fcanSr2l8zgRMvDfydHW3cC',
  monthly_income: 2500000.00,   // Rp2.500.000 (uang saku + part-time)
  age: 21,
  occupation: 'mahasiswa',
  financial_goal: 'hemat',
  risk_profile: 'moderat',
};

// ── Transaction Seed Data ────────────────────────────────────
const seedTransactions = [
  // ── April 2026 ────────────────────────────────────────────
  { amount: 35000,  category: 'makanan',    date: '2026-04-01', payment_method: 'ewallet',  description: 'Makan siang nasi padang',             transaction_type: 'expense', hour_of_day: 12, is_recurring: false },
  { amount: 15000,  category: 'transport',  date: '2026-04-01', payment_method: 'ewallet',  description: 'Gojek ke kampus',                     transaction_type: 'expense', hour_of_day: 7,  is_recurring: false },
  { amount: 120000, category: 'belanja',    date: '2026-04-02', payment_method: 'debit',    description: 'Beli baju di Uniqlo',                  transaction_type: 'expense', hour_of_day: 15, is_recurring: false },
  { amount: 50000,  category: 'hiburan',    date: '2026-04-02', payment_method: 'ewallet',  description: 'Nonton bioskop',                       transaction_type: 'expense', hour_of_day: 19, is_recurring: false },
  { amount: 25000,  category: 'makanan',    date: '2026-04-03', payment_method: 'cash',     description: 'Kopi di Starbucks',                    transaction_type: 'expense', hour_of_day: 10, is_recurring: false },
  { amount: 200000, category: 'tagihan',    date: '2026-04-03', payment_method: 'transfer', description: 'Bayar kuota internet bulanan',          transaction_type: 'expense', hour_of_day: 9,  is_recurring: true },
  { amount: 45000,  category: 'makanan',    date: '2026-04-04', payment_method: 'qris',     description: 'Makan malam di warteg',                transaction_type: 'expense', hour_of_day: 19, is_recurring: false },
  { amount: 12000,  category: 'transport',  date: '2026-04-04', payment_method: 'ewallet',  description: 'Grab ke mall',                         transaction_type: 'expense', hour_of_day: 14, is_recurring: false },
  { amount: 350000, category: 'pendidikan', date: '2026-04-05', payment_method: 'transfer', description: 'Beli buku kuliah semester ini',         transaction_type: 'expense', hour_of_day: 11, is_recurring: false },
  { amount: 75000,  category: 'hiburan',    date: '2026-04-05', payment_method: 'ewallet',  description: 'Langganan Spotify Premium',             transaction_type: 'expense', hour_of_day: 20, is_recurring: true },
  { amount: 28000,  category: 'makanan',    date: '2026-04-06', payment_method: 'cash',     description: 'Beli makan di kantin kampus',           transaction_type: 'expense', hour_of_day: 12, is_recurring: false },
  { amount: 150000, category: 'kesehatan',  date: '2026-04-06', payment_method: 'debit',    description: 'Beli vitamin dan obat',                transaction_type: 'expense', hour_of_day: 16, is_recurring: false },
  { amount: 85000,  category: 'belanja',    date: '2026-04-07', payment_method: 'ewallet',  description: 'Belanja skincare di Sociolla',          transaction_type: 'expense', hour_of_day: 21, is_recurring: false },
  { amount: 20000,  category: 'transport',  date: '2026-04-07', payment_method: 'ewallet',  description: 'Gojek pulang dari gym',                transaction_type: 'expense', hour_of_day: 18, is_recurring: false },
  { amount: 55000,  category: 'makanan',    date: '2026-04-08', payment_method: 'qris',     description: 'Makan sushi di resto Jepang',           transaction_type: 'expense', hour_of_day: 13, is_recurring: false },
  { amount: 100000, category: 'hiburan',    date: '2026-04-08', payment_method: 'debit',    description: 'Top up game Mobile Legends',            transaction_type: 'expense', hour_of_day: 22, is_recurring: false },
  { amount: 40000,  category: 'makanan',    date: '2026-04-09', payment_method: 'cash',     description: 'Beli bakso dan es teh',                transaction_type: 'expense', hour_of_day: 17, is_recurring: false },
  { amount: 300000, category: 'tagihan',    date: '2026-04-09', payment_method: 'transfer', description: 'Bayar listrik kosan',                  transaction_type: 'expense', hour_of_day: 8,  is_recurring: true },
  { amount: 180000, category: 'belanja',    date: '2026-04-10', payment_method: 'credit',   description: 'Beli case HP dan aksesoris',            transaction_type: 'expense', hour_of_day: 14, is_recurring: false },
  { amount: 22000,  category: 'transport',  date: '2026-04-10', payment_method: 'ewallet',  description: 'Naik Grab ke stasiun',                 transaction_type: 'expense', hour_of_day: 6,  is_recurring: false },
  { amount: 65000,  category: 'makanan',    date: '2026-04-11', payment_method: 'qris',     description: 'Dinner di McDonalds',                  transaction_type: 'expense', hour_of_day: 20, is_recurring: false },
  { amount: 30000,  category: 'lainnya',    date: '2026-04-11', payment_method: 'cash',     description: 'Fotocopy tugas kuliah',                transaction_type: 'expense', hour_of_day: 10, is_recurring: false },
  { amount: 250000, category: 'belanja',    date: '2026-04-12', payment_method: 'ewallet',  description: 'Beli earbuds di Tokopedia',             transaction_type: 'expense', hour_of_day: 23, is_recurring: false },
  { amount: 18000,  category: 'makanan',    date: '2026-04-12', payment_method: 'cash',     description: 'Sarapan bubur ayam',                   transaction_type: 'expense', hour_of_day: 7,  is_recurring: false },
  { amount: 90000,  category: 'kesehatan',  date: '2026-04-13', payment_method: 'debit',    description: 'Gym membership mingguan',               transaction_type: 'expense', hour_of_day: 6,  is_recurring: true },
  // ── Maret 2026 (data bulan lalu untuk monthly chart) ──────
  { amount: 450000, category: 'belanja',    date: '2026-03-15', payment_method: 'credit',   description: 'Belanja bulanan di supermarket',        transaction_type: 'expense', hour_of_day: 11, is_recurring: true },
  { amount: 200000, category: 'tagihan',    date: '2026-03-10', payment_method: 'transfer', description: 'Bayar listrik Maret',                  transaction_type: 'expense', hour_of_day: 9,  is_recurring: true },
  { amount: 150000, category: 'makanan',    date: '2026-03-20', payment_method: 'ewallet',  description: 'Makan bersama teman',                  transaction_type: 'expense', hour_of_day: 19, is_recurring: false },
  // ── Februari 2026 ─────────────────────────────────────────
  { amount: 500000, category: 'pendidikan', date: '2026-02-01', payment_method: 'transfer', description: 'Bayar UKT semester genap',              transaction_type: 'expense', hour_of_day: 10, is_recurring: false },
  { amount: 250000, category: 'tagihan',    date: '2026-02-10', payment_method: 'transfer', description: 'Bayar listrik Februari',               transaction_type: 'expense', hour_of_day: 9,  is_recurring: true },
];

// ── Budget Seed Data (April 2026) ────────────────────────────
const seedBudgets = [
  { category: 'makanan',    limit_amount: 800000,  month: '2026-04-01' },
  { category: 'transport',  limit_amount: 300000,  month: '2026-04-01' },
  { category: 'hiburan',    limit_amount: 250000,  month: '2026-04-01' },
  { category: 'belanja',    limit_amount: 400000,  month: '2026-04-01' },
  { category: 'tagihan',    limit_amount: 500000,  month: '2026-04-01' },
  { category: 'pendidikan', limit_amount: 350000,  month: '2026-04-01' },
  { category: 'kesehatan',  limit_amount: 200000,  month: '2026-04-01' },
  { category: 'lainnya',    limit_amount: 100000,  month: '2026-04-01' },
];

async function runSeeder() {
  try {
    console.log('🌱  Connecting to database...');
    await sequelize.authenticate();

    console.log('🌱  Syncing models (with associations)...');
    await sequelize.sync({ alter: true });

    console.log('🌱  Clearing existing data...');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await Budget.destroy({ where: {}, force: true });
    await Transaction.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    // ── 1. Seed User ──────────────────────────────────────────
    console.log('🌱  Inserting default user...');
    const user = await User.create({
      ...defaultUser,
      created_at: new Date('2026-01-15T08:00:00'),
    });
    console.log(`    ✅  User created: ${user.name} (id=${user.id})`);

    // ── 2. Seed Transactions ──────────────────────────────────

    console.log(`🌱  Inserting ${seedTransactions.length} transactions...`);
    for (const row of seedTransactions) {
      await Transaction.create({
        ...row,
        user_id: user.id,
        created_at: new Date(`${row.date}T${String(row.hour_of_day).padStart(2, '0')}:00:00`),
      });
    }
    console.log(`    ✅  ${seedTransactions.length} transaksi ditambahkan.`);

    // ── 3. Seed Budgets ───────────────────────────────────────

    console.log(`🌱  Inserting ${seedBudgets.length} budgets...`);
    for (const row of seedBudgets) {
      await Budget.create({
        ...row,
        user_id: user.id,
        created_at: new Date('2026-04-01T00:00:00'),
      });
    }
    console.log(`    ✅  ${seedBudgets.length} budget ditambahkan.`);

    console.log('');
    console.log('════════════════════════════════════════════');
    console.log('  ✅  Seeder selesai!');
    console.log(`     • 1 user  (${user.name})`)
    console.log(`     • ${seedTransactions.length} transactions`);
    console.log(`     • ${seedBudgets.length} budgets`);
    console.log('════════════════════════════════════════════');

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('❌  Seeder gagal:', err.message);
    console.error(err);
    process.exit(1);
  }
}

runSeeder();
