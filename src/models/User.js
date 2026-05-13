'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * User Model
 *
 * Merepresentasikan pengguna FinZ.
 * Password disimpan dalam bentuk hash (bcrypt) — hashing dilakukan
 * di layer service/controller, bukan di model.
 */
const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Nama lengkap pengguna',
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
      comment: 'Email unik untuk login',
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Password yang sudah di-hash (bcrypt)',
    },
    monthly_income: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
      comment: 'Pemasukan bulanan dalam Rupiah',
    },
    age: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: true,
      validate: {
        min: 1,
        max: 150,
      },
      comment: 'Usia pengguna',
    },
    occupation: {
      type: DataTypes.ENUM('mahasiswa', 'karyawan', 'freelancer', 'wirausaha'),
      allowNull: true,
      comment: 'Pekerjaan/status pengguna',
    },
    financial_goal: {
      type: DataTypes.ENUM('hemat', 'investasi', 'bebas_utang', 'dana_darurat'),
      allowNull: true,
      comment: 'Tujuan keuangan utama',
    },
    risk_profile: {
      type: DataTypes.ENUM('konservatif', 'moderat', 'agresif'),
      allowNull: true,
      comment: 'Profil risiko investasi',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'users',
    timestamps: false,
    indexes: [
      { unique: true, fields: ['email'] },
    ],
  }
);

module.exports = User;
