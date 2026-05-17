'use strict';

/**
 * Models Index
 *
 * Central file untuk import semua model dan mendefinisikan associations.
 * Gunakan `const { User, Transaction, Budget, PredictionLog } = require('./models');`
 * di file lain untuk akses semua model sekaligus.
 */

const sequelize     = require('../config/database');
const User          = require('./User');
const Transaction   = require('./Transaction');
const Budget        = require('./Budget');
const PredictionLog = require('./PredictionLog');

// ═══════════════════════════════════════════════════════════════
// Associations
// ═══════════════════════════════════════════════════════════════

// User ↔ Transaction
User.hasMany(Transaction, {
  foreignKey: 'user_id',
  as: 'transactions',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
Transaction.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// User ↔ Budget
User.hasMany(Budget, {
  foreignKey: 'user_id',
  as: 'budgets',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
Budget.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

// ═══════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════

module.exports = {
  sequelize,
  User,
  Transaction,
  Budget,
  PredictionLog,
};
