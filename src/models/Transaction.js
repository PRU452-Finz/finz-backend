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
        'lainnya'
      ),
      allowNull: false,
      comment: 'Kategori pengeluaran',
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
    timestamps: false, // Kita mengelola created_at manual sesuai spec
    indexes: [
      { fields: ['user_id'] },
      { fields: ['category'] },
      { fields: ['date'] },
    ],
  }
);

module.exports = Transaction;
