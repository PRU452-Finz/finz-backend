'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * PredictionLog Model
 *
 * Menyimpan log prediksi kategori dari AI/rule-based engine.
 * Berguna untuk audit, retraining, dan tracking akurasi model.
 * Jika user meng-override prediksi, field `user_overridden` = true
 * dan `final_category` berisi kategori yang dipilih user.
 */
const PredictionLog = sequelize.define(
  'PredictionLog',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    input_text: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: 'Teks deskripsi yang di-input user',
    },
    predicted_category: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Kategori hasil prediksi AI/rule-based',
    },
    confidence: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 1,
      },
      comment: 'Skor kepercayaan prediksi (0.00 – 1.00)',
    },
    model_version: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: 'rule-v1',
      comment: 'Versi model yang digunakan',
    },
    user_overridden: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Apakah user mengganti prediksi?',
    },
    final_category: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Kategori akhir yang dipakai (bisa sama atau beda dengan prediksi)',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'prediction_logs',
    timestamps: false,
    indexes: [
      { fields: ['predicted_category'] },
      { fields: ['created_at'] },
    ],
  }
);

module.exports = PredictionLog;
