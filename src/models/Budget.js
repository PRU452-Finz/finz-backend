'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Budget Model
 *
 * Menyimpan batas anggaran (budget limit) per kategori per bulan
 * untuk setiap pengguna.
 * Field `month` disimpan sebagai DATE dengan format YYYY-MM-01.
 */
const Budget = sequelize.define(
  'Budget',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: 'FK → users.id',
    },
    category: {
      type: DataTypes.ENUM(
        'makanan',
        'transport',
        'hiburan',
        'belanja',
        'tagihan',
        'pendidikan',
        'kesehatan',
        'lainnya'
      ),
      allowNull: false,
      comment: 'Kategori anggaran (sama dengan ENUM transaksi)',
    },
    limit_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
      comment: 'Batas anggaran dalam Rupiah',
    },
    month: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Bulan anggaran, format YYYY-MM-01',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'budgets',
    timestamps: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['category'] },
      { fields: ['month'] },
      { unique: true, fields: ['user_id', 'category', 'month'] }, // 1 budget per kategori per bulan
    ],
  }
);

module.exports = Budget;
