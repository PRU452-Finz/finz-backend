'use strict';

/**
 * FinZ Backend — server.js
 *
 * Entry point: koneksi database lalu jalankan HTTP server.
 */

require('dotenv').config();

const app       = require('./app');
const { sequelize } = require('./models'); // Import dari index agar semua association terdaftar

const PORT = process.env.PORT || 8000;

async function startServer() {
  try {
    // ─── 1. Test koneksi database ───────────────────────────────
    await sequelize.authenticate();
    console.log('✅  Database connected successfully');

    // ─── 2. Sync model ke tabel (alter aman saat development) ──
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('✅  Database synchronized');

    // ─── 3. Jalankan server ─────────────────────────────────────
    app.listen(PORT, () => {
      console.log('');
      console.log('╔══════════════════════════════════════════════╗');
      console.log(`║   FinZ Backend API — running on port ${PORT}   ║`);
      console.log('╚══════════════════════════════════════════════╝');
      console.log(`   URL : http://localhost:${PORT}`);
      console.log(`   ENV : ${process.env.NODE_ENV || 'development'}`);
      console.log(`   DB  : ${process.env.DB_NAME}@${process.env.DB_HOST}`);
      console.log('');
    });
  } catch (err) {
    console.error('❌  Gagal menjalankan server:', err.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received — closing database connection');
  await sequelize.close();
  process.exit(0);
});

startServer();
