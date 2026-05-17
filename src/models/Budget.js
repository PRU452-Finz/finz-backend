'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Budget = sequelize.define(
  'Budget',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
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
    },
    limit_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    month: {
      type: DataTypes.STRING(7), // Format 'YYYY-MM'
      allowNull: false,
    },
  },
  {
    tableName: 'budgets',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

// Define associations
User.hasMany(Budget, { foreignKey: 'user_id', as: 'budgets' });
Budget.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = Budget;
