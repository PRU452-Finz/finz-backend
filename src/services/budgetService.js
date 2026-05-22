'use strict';

const { Op, fn, col } = require('sequelize');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

const getSpendingByCategory = async (userId, firstDay, lastDay) => {
  const spendingRows = await Transaction.findAll({
    attributes: [
      'category',
      [fn('SUM', col('amount')), 'total_spent'],
    ],
    where: {
      user_id: userId,
      transaction_type: 'expense',
      date: { [Op.between]: [firstDay, lastDay] },
    },
    group: ['category'],
    raw: true,
  });

  const spendingMap = {};
  spendingRows.forEach((row) => {
    spendingMap[row.category] = parseFloat(row.total_spent);
  });

  return spendingMap;
};

const getUserBudgets = async (userId, month) => {
  const now = new Date();
  const targetMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const budgets = await Budget.findAll({
    where: {
      user_id: userId,
      month: targetMonth,
    },
  });

  const firstDay = `${targetMonth}-01`;
  const lastDay = new Date(
    parseInt(targetMonth.split('-')[0]),
    parseInt(targetMonth.split('-')[1]),
    0
  ).toISOString().slice(0, 10);

  const spendingMap = await getSpendingByCategory(userId, firstDay, lastDay);

  return budgets.map((budget) => {
    const budgetObj = budget.toJSON();
    budgetObj.spent = spendingMap[budget.category] || 0;
    return budgetObj;
  });
};

const upsertBudget = async (userId, data) => {
  const { category, limit_amount, month } = data;

  let budget = await Budget.findOne({
    where: {
      user_id: userId,
      category,
      month,
    },
  });

  if (budget) {
    budget.limit_amount = limit_amount;
    await budget.save();
    return budget;
  }

  budget = await Budget.create({
    user_id: userId,
    category,
    limit_amount,
    month,
  });

  return budget;
};

const deleteBudget = async (userId, budgetId) => {
  const budget = await Budget.findOne({
    where: { id: budgetId, user_id: userId },
  });

  if (!budget) return false;

  await budget.destroy();
  return true;
};

module.exports = {
  getUserBudgets,
  upsertBudget,
  deleteBudget,
  getSpendingByCategory,
};
