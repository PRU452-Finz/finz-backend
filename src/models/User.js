'use strict';

const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Hashed password (bcrypt)',
    },
    monthly_income: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      comment: 'Pemasukan bulanan user (Rp)',
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    occupation: {
      type: DataTypes.ENUM('mahasiswa', 'karyawan', 'freelancer', 'wirausaha', 'lainnya'),
      allowNull: false,
      defaultValue: 'karyawan',
    },
    financial_goal: {
      type: DataTypes.ENUM('hemat', 'investasi', 'bebas_utang', 'dana_darurat'),
      allowNull: false,
      defaultValue: 'dana_darurat',
    },
    risk_profile: {
      type: DataTypes.ENUM('konservatif', 'moderat', 'agresif'),
      allowNull: false,
      defaultValue: 'konservatif',
    },
  },
  {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
    },
  }
);

/**
 * Compare candidate password with hashed password
 * @param {string} candidatePassword - Password to compare
 * @returns {Promise<boolean>}
 */
User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Return user data tanpa password (untuk response JSON)
 */
User.prototype.toSafeJSON = function () {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

module.exports = User;
