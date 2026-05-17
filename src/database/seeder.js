'use strict';

/**
 * FinZ Database Seeder
 *
 * Menjalankan: npm run seed
 *
 * Data realistis mahasiswa Gen-Z selama 3 bulan:
 * - 2 user demo
 * - Budget per kategori per bulan
 * - Transaksi income + expense yang beragam
 * - Data cukup untuk menguji semua fitur: dashboard, chart, AI prediksi, budget alert
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const sequelize   = require('../config/database');
const Transaction = require('../models/Transaction');
const User        = require('../models/User');
const Budget      = require('../models/Budget');

// ─── Helper: tanggal relatif ke bulan ini ──────────────────
const now = new Date();
const Y   = now.getFullYear();
const M   = now.getMonth(); // 0-indexed

const d = (monthOffset, day) => {
  const dt = new Date(Y, M + monthOffset, day);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
};

const ym = (monthOffset) => {
  const dt = new Date(Y, M + monthOffset, 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
};

// ═══════════════════════════════════════════════════════════════
// USER 1: Bayu — Mahasiswa aktif, income dari part-time + uang saku
// ═══════════════════════════════════════════════════════════════

const bayuTransactions = [
  // ── BULAN INI (current month) ─────────────────────────────
  // Income
  { amount: 5000000, category: 'gaji',      date: d(0, 1),  payment_method: 'transfer', description: 'Gaji part-time kantor',        transaction_type: 'income' },
  { amount: 2000000, category: 'pemasukan', date: d(0, 1),  payment_method: 'transfer', description: 'Uang saku dari orang tua',     transaction_type: 'income' },
  { amount: 500000,  category: 'bonus',     date: d(0, 10), payment_method: 'transfer', description: 'Bonus project freelance',       transaction_type: 'income' },

  // Makanan (total: 1.320.000 → mendekati budget 1.500.000 = 88% ⚠️ warning)
  { amount: 35000,  category: 'makanan',    date: d(0, 1),  payment_method: 'ewallet',  description: 'Makan siang nasi padang',       transaction_type: 'expense' },
  { amount: 25000,  category: 'makanan',    date: d(0, 2),  payment_method: 'cash',     description: 'Kopi di Starbucks',             transaction_type: 'expense' },
  { amount: 45000,  category: 'makanan',    date: d(0, 3),  payment_method: 'qris',     description: 'Makan malam di warteg',         transaction_type: 'expense' },
  { amount: 28000,  category: 'makanan',    date: d(0, 4),  payment_method: 'cash',     description: 'Beli makan di kantin kampus',   transaction_type: 'expense' },
  { amount: 55000,  category: 'makanan',    date: d(0, 5),  payment_method: 'qris',     description: 'Makan sushi di resto Jepang',   transaction_type: 'expense' },
  { amount: 40000,  category: 'makanan',    date: d(0, 6),  payment_method: 'cash',     description: 'Beli bakso dan es teh',         transaction_type: 'expense' },
  { amount: 65000,  category: 'makanan',    date: d(0, 7),  payment_method: 'qris',     description: 'Dinner di McDonalds',           transaction_type: 'expense' },
  { amount: 18000,  category: 'makanan',    date: d(0, 8),  payment_method: 'cash',     description: 'Sarapan bubur ayam',            transaction_type: 'expense' },
  { amount: 42000,  category: 'makanan',    date: d(0, 9),  payment_method: 'ewallet',  description: 'Makan ayam geprek',             transaction_type: 'expense' },
  { amount: 150000, category: 'makanan',    date: d(0, 10), payment_method: 'ewallet',  description: 'Makan bersama teman di resto',  transaction_type: 'expense' },
  { amount: 32000,  category: 'makanan',    date: d(0, 11), payment_method: 'cash',     description: 'Beli cimol dan cireng',         transaction_type: 'expense' },
  { amount: 85000,  category: 'makanan',    date: d(0, 12), payment_method: 'qris',     description: 'GrabFood nasi goreng seafood',  transaction_type: 'expense' },
  { amount: 200000, category: 'makanan',    date: d(0, 13), payment_method: 'ewallet',  description: 'All you can eat BBQ',           transaction_type: 'expense' },
  { amount: 35000,  category: 'makanan',    date: d(0, 14), payment_method: 'cash',     description: 'Beli nasi kuning pagi',         transaction_type: 'expense' },
  { amount: 120000, category: 'makanan',    date: d(0, 15), payment_method: 'ewallet',  description: 'Beli pizza delivery',           transaction_type: 'expense' },
  { amount: 45000,  category: 'makanan',    date: d(0, 16), payment_method: 'cash',     description: 'Makan soto di pinggir jalan',   transaction_type: 'expense' },
  { amount: 200000, category: 'makanan',    date: d(0, 17), payment_method: 'qris',     description: 'Dinner anniversary di kafe',    transaction_type: 'expense' },

  // Transport (total: 297.000 → 59% budget → aman)
  { amount: 15000,  category: 'transport',  date: d(0, 1),  payment_method: 'ewallet',  description: 'Gojek ke kampus',               transaction_type: 'expense' },
  { amount: 12000,  category: 'transport',  date: d(0, 3),  payment_method: 'ewallet',  description: 'Grab ke mall',                  transaction_type: 'expense' },
  { amount: 20000,  category: 'transport',  date: d(0, 5),  payment_method: 'ewallet',  description: 'Gojek pulang dari gym',         transaction_type: 'expense' },
  { amount: 22000,  category: 'transport',  date: d(0, 7),  payment_method: 'ewallet',  description: 'Naik Grab ke stasiun',          transaction_type: 'expense' },
  { amount: 50000,  category: 'transport',  date: d(0, 9),  payment_method: 'cash',     description: 'Isi bensin motor',              transaction_type: 'expense' },
  { amount: 8000,   category: 'transport',  date: d(0, 11), payment_method: 'ewallet',  description: 'Naik angkot ke kampus',         transaction_type: 'expense' },
  { amount: 70000,  category: 'transport',  date: d(0, 13), payment_method: 'ewallet',  description: 'Grab Car ke bandara',           transaction_type: 'expense' },
  { amount: 100000, category: 'transport',  date: d(0, 15), payment_method: 'cash',     description: 'Bayar parkir dan bensin',       transaction_type: 'expense' },

  // Hiburan (total: 475.000 → 95% budget → ⚠️ hampir habis!)
  { amount: 50000,  category: 'hiburan',    date: d(0, 2),  payment_method: 'ewallet',  description: 'Nonton bioskop',                transaction_type: 'expense' },
  { amount: 75000,  category: 'hiburan',    date: d(0, 4),  payment_method: 'ewallet',  description: 'Langganan Spotify Premium',     transaction_type: 'expense' },
  { amount: 100000, category: 'hiburan',    date: d(0, 8),  payment_method: 'debit',    description: 'Top up game Mobile Legends',    transaction_type: 'expense' },
  { amount: 50000,  category: 'hiburan',    date: d(0, 12), payment_method: 'ewallet',  description: 'Langganan Netflix',             transaction_type: 'expense' },
  { amount: 200000, category: 'hiburan',    date: d(0, 16), payment_method: 'debit',    description: 'Beli tiket konser musik',       transaction_type: 'expense' },

  // Belanja (total: 635.000 → 64% budget → aman)
  { amount: 120000, category: 'belanja',    date: d(0, 2),  payment_method: 'debit',    description: 'Beli baju di Uniqlo',           transaction_type: 'expense' },
  { amount: 85000,  category: 'belanja',    date: d(0, 6),  payment_method: 'ewallet',  description: 'Belanja skincare di Sociolla',  transaction_type: 'expense' },
  { amount: 180000, category: 'belanja',    date: d(0, 10), payment_method: 'credit',   description: 'Beli case HP dan aksesoris',    transaction_type: 'expense' },
  { amount: 250000, category: 'belanja',    date: d(0, 14), payment_method: 'ewallet',  description: 'Beli earbuds di Tokopedia',     transaction_type: 'expense' },

  // Tagihan (total: 700.000)
  { amount: 200000, category: 'tagihan',    date: d(0, 3),  payment_method: 'transfer', description: 'Bayar kuota internet bulanan',  transaction_type: 'expense' },
  { amount: 300000, category: 'tagihan',    date: d(0, 9),  payment_method: 'transfer', description: 'Bayar listrik kosan',           transaction_type: 'expense' },
  { amount: 200000, category: 'tagihan',    date: d(0, 15), payment_method: 'transfer', description: 'Bayar air PDAM',                transaction_type: 'expense' },

  // Pendidikan (total: 500.000)
  { amount: 350000, category: 'pendidikan', date: d(0, 5),  payment_method: 'transfer', description: 'Beli buku kuliah semester ini', transaction_type: 'expense' },
  { amount: 150000, category: 'pendidikan', date: d(0, 12), payment_method: 'ewallet',  description: 'Beli alat tulis dan print',     transaction_type: 'expense' },

  // Kesehatan (total: 340.000)
  { amount: 150000, category: 'kesehatan',  date: d(0, 4),  payment_method: 'debit',    description: 'Beli vitamin dan obat',         transaction_type: 'expense' },
  { amount: 90000,  category: 'kesehatan',  date: d(0, 10), payment_method: 'debit',    description: 'Gym membership mingguan',       transaction_type: 'expense' },
  { amount: 100000, category: 'kesehatan',  date: d(0, 16), payment_method: 'cash',     description: 'Beli obat flu di apotek',       transaction_type: 'expense' },

  // Lainnya
  { amount: 30000,  category: 'lainnya',    date: d(0, 11), payment_method: 'cash',     description: 'Fotocopy tugas kuliah',         transaction_type: 'expense' },
  { amount: 50000,  category: 'lainnya',    date: d(0, 14), payment_method: 'ewallet',  description: 'Cuci baju laundry',             transaction_type: 'expense' },

  // ── BULAN LALU (-1) ───────────────────────────────────────
  { amount: 5000000, category: 'gaji',      date: d(-1, 1),  payment_method: 'transfer', description: 'Gaji part-time',               transaction_type: 'income' },
  { amount: 2000000, category: 'pemasukan', date: d(-1, 1),  payment_method: 'transfer', description: 'Uang saku orang tua',          transaction_type: 'income' },
  { amount: 450000,  category: 'belanja',   date: d(-1, 5),  payment_method: 'credit',   description: 'Belanja bulanan supermarket',  transaction_type: 'expense' },
  { amount: 200000,  category: 'tagihan',   date: d(-1, 10), payment_method: 'transfer', description: 'Bayar listrik bulan lalu',     transaction_type: 'expense' },
  { amount: 150000,  category: 'makanan',   date: d(-1, 15), payment_method: 'ewallet',  description: 'Makan bersama teman',          transaction_type: 'expense' },
  { amount: 800000,  category: 'makanan',   date: d(-1, 20), payment_method: 'cash',     description: 'Makan sebulan awal',           transaction_type: 'expense' },
  { amount: 75000,   category: 'hiburan',   date: d(-1, 12), payment_method: 'ewallet',  description: 'Spotify + Netflix',            transaction_type: 'expense' },
  { amount: 300000,  category: 'tagihan',   date: d(-1, 8),  payment_method: 'transfer', description: 'Bayar air + internet',         transaction_type: 'expense' },
  { amount: 100000,  category: 'transport', date: d(-1, 18), payment_method: 'ewallet',  description: 'Transport sebulan',            transaction_type: 'expense' },

  // ── 2 BULAN LALU (-2) ─────────────────────────────────────
  { amount: 5000000, category: 'gaji',      date: d(-2, 1),  payment_method: 'transfer', description: 'Gaji part-time',               transaction_type: 'income' },
  { amount: 2000000, category: 'pemasukan', date: d(-2, 1),  payment_method: 'transfer', description: 'Uang saku',                    transaction_type: 'income' },
  { amount: 500000,  category: 'pendidikan',date: d(-2, 1),  payment_method: 'transfer', description: 'Bayar UKT semester genap',     transaction_type: 'expense' },
  { amount: 250000,  category: 'tagihan',   date: d(-2, 10), payment_method: 'transfer', description: 'Bayar listrik 2 bln lalu',     transaction_type: 'expense' },
  { amount: 600000,  category: 'makanan',   date: d(-2, 15), payment_method: 'cash',     description: 'Makan sebulan',                transaction_type: 'expense' },
  { amount: 200000,  category: 'belanja',   date: d(-2, 20), payment_method: 'ewallet',  description: 'Belanja online',               transaction_type: 'expense' },
  { amount: 75000,   category: 'hiburan',   date: d(-2, 5),  payment_method: 'ewallet',  description: 'Streaming langganan',          transaction_type: 'expense' },
];

// ═══════════════════════════════════════════════════════════════
// BUDGET: Bayu — bulan ini
// ═══════════════════════════════════════════════════════════════
const bayuBudgets = [
  { category: 'makanan',    limit_amount: 1500000 },  // Total spend: ~1.32M (88%) → ⚠️
  { category: 'transport',  limit_amount: 500000  },  // Total spend: ~297K (59%) → ✅
  { category: 'hiburan',    limit_amount: 500000  },  // Total spend: ~475K (95%) → ⚠️
  { category: 'belanja',    limit_amount: 1000000 },  // Total spend: ~635K (64%) → ✅
  { category: 'tagihan',    limit_amount: 1000000 },  // Total spend: ~700K (70%) → ✅
  { category: 'pendidikan', limit_amount: 500000  },  // Total spend: ~500K (100%) → 🔴
  { category: 'kesehatan',  limit_amount: 500000  },  // Total spend: ~340K (68%) → ✅
];

// ═══════════════════════════════════════════════════════════════
// SEEDER EXECUTION
// ═══════════════════════════════════════════════════════════════
async function runSeeder() {
  try {
    console.log('🌱  Connecting to database...');
    await sequelize.authenticate();

    console.log('🌱  Syncing models...');
    await sequelize.sync({ alter: true });

    console.log('🌱  Clearing existing data...');
    await Transaction.destroy({ where: {}, truncate: false });
    await Budget.destroy({ where: {}, truncate: false });
    await User.destroy({ where: {}, truncate: false });

    // ── Users ─────────────────────────────────────────────────
    console.log('🌱  Creating demo users...');
    const bayu = await User.create({
      id: 1,
      name: 'Bayu',
      email: 'bayu@finz.id',
      password: 'finz1234',
      monthly_income: 7000000,
      age: 21,
      occupation: 'mahasiswa',
      financial_goal: 'hemat',
      risk_profile: 'moderat',
    });

    await User.create({
      id: 2,
      name: 'Masbay',
      email: 'masbay@example.com',
      password: 'finz1234',
      monthly_income: 3500000,
      age: 22,
      occupation: 'mahasiswa',
      financial_goal: 'dana_darurat',
      risk_profile: 'konservatif',
    });

    // ── Budgets (bulan ini) ──────────────────────────────────
    console.log('🌱  Creating budgets...');
    const currentMonth = ym(0);
    for (const b of bayuBudgets) {
      await Budget.create({
        user_id: 1,
        category: b.category,
        limit_amount: b.limit_amount,
        month: currentMonth,
      });
    }

    // ── Transactions ────────────────────────────────────────
    console.log(`🌱  Inserting ${bayuTransactions.length} transactions...`);
    for (const row of bayuTransactions) {
      await Transaction.create({
        user_id: 1,
        amount: row.amount,
        category: row.category,
        date: row.date,
        payment_method: row.payment_method,
        description: row.description,
        transaction_type: row.transaction_type || 'expense',
        created_at: new Date(`${row.date}T08:00:00`),
      });
    }

    // ── Summary ─────────────────────────────────────────────
    const thisMonthTxns = bayuTransactions.filter(t => t.date.startsWith(currentMonth));
    const income  = thisMonthTxns.filter(t => t.transaction_type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = thisMonthTxns.filter(t => t.transaction_type !== 'income').reduce((s, t) => s + t.amount, 0);

    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║             FinZ Seeder — Summary                ║');
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  Users       : 2 (bayu@finz.id / finz1234)      ║`);
    console.log(`║  Transactions: ${bayuTransactions.length} total                        ║`);
    console.log(`║  Budgets     : ${bayuBudgets.length} kategori (bulan ${currentMonth})     ║`);
    console.log('╠══════════════════════════════════════════════════╣');
    console.log(`║  Bulan Ini:                                      ║`);
    console.log(`║    Income  : Rp ${income.toLocaleString('id-ID').padEnd(13)}              ║`);
    console.log(`║    Expense : Rp ${expense.toLocaleString('id-ID').padEnd(13)}              ║`);
    console.log(`║    Saldo   : Rp ${(income - expense).toLocaleString('id-ID').padEnd(13)}              ║`);
    console.log('╚══════════════════════════════════════════════════╝');

    console.log('\n✅  Seeder berhasil!');
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('❌  Seeder gagal:', err.message);
    console.error(err);
    process.exit(1);
  }
}

runSeeder();
