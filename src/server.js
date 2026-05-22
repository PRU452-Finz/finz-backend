'use strict';

const logger = require('./config/logger');

/**
 * FinZ Backend — server.js
 *
 * Entry point: koneksi database lalu jalankan HTTP server.
 */

require('dotenv').config();

const app       = require('./app');
const { sequelize } = require('./models'); // Import dari index agar semua association terdaftar
const redis     = require('./config/redis');

const PORT = process.env.PORT || 8000;

async function startServer() {
  try {
    // ─── 1. Test koneksi database ───────────────────────────────
    await sequelize.authenticate();
    logger.info('✅  Database connected successfully');

    // ─── 2. Database schema ───────────────────────────────────
    // Use migrations: npx sequelize-cli db:migrate

    // ─── 3. Jalankan server ─────────────────────────────────────
    app.listen(PORT, () => {
      logger.info('');
      logger.info('╔══════════════════════════════════════════════╗');
      logger.info(`║   FinZ Backend API — running on port ${PORT}   ║`);
      logger.info('╚══════════════════════════════════════════════╝');
      logger.info(`   URL : http://localhost:${PORT}`);
      logger.info(`   ENV : ${process.env.NODE_ENV || 'development'}`);
      logger.info(`   DB  : ${process.env.DB_NAME}@${process.env.DB_HOST}`);
      logger.info('');
    });
  } catch (err) {
    logger.error('❌  Gagal menjalankan server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received`);
  try {
    await redis.quit();
  } catch (err) {
    logger.warn('Redis shutdown warning:', err.message);
  }
  await sequelize.close();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

startServer();
