'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Transaction Model
 *
 * Merepresentasikan satu transaksi keuangan pengguna.
 * Field `nominal` dipakai (sesuai frontend FinZ) untuk amount.
 */
const Transaction = sequelize.define(
  'Transaction',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1, // Default user sampai auth diimplementasi
      comment: 'ID pengguna pemilik transaksi',
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0,
        isDecimal: true,
      },
      comment: 'Nominal transaksi dalam Rupiah',
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
        'pemasukan',
        'gaji',
        'bonus',
        'investasi',
        'lainnya'
      ),
      allowNull: false,
      comment: 'Kategori pengeluaran atau pemasukan',
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: '',
      comment: 'Deskripsi singkat transaksi',
    },
    payment_method: {
      type: DataTypes.ENUM(
        'cash',
        'debit',
        'credit',
        'ewallet',
        'transfer',
        'qris'
      ),
      allowNull: false,
      defaultValue: 'cash',
      comment: 'Metode pembayaran',
    },
    transaction_type: {
      type: DataTypes.ENUM('expense', 'income'),
      allowNull: false,
      defaultValue: 'expense',
      comment: 'Bedakan pemasukan vs pengeluaran',
    },
    hour_of_day: {
      type: DataTypes.TINYINT,
      allowNull: true,
      comment: 'Jam transaksi untuk pola temporal (0-23)',
    },
    is_recurring: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Apakah transaksi rutin bulanan',
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Tanggal transaksi (YYYY-MM-DD)',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'transactions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['category'] },
      { fields: ['date'] },
      { fields: ['transaction_type'] },
    ],
  }
);

module.exports = Transaction;
