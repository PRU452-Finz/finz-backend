'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transactions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'ID pengguna pemilik transaksi',
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        comment: 'Nominal transaksi dalam Rupiah',
      },
      category: {
        type: Sequelize.ENUM(
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
        type: Sequelize.STRING(255),
        allowNull: false,
        defaultValue: '',
        comment: 'Deskripsi singkat transaksi',
      },
      payment_method: {
        type: Sequelize.ENUM('cash', 'debit', 'credit', 'ewallet', 'transfer', 'qris'),
        allowNull: false,
        defaultValue: 'cash',
        comment: 'Metode pembayaran',
      },
      transaction_type: {
        type: Sequelize.ENUM('expense', 'income'),
        allowNull: false,
        defaultValue: 'expense',
        comment: 'Bedakan pemasukan vs pengeluaran',
      },
      hour_of_day: {
        type: Sequelize.SMALLINT,
        allowNull: true,
        comment: 'Jam transaksi untuk pola temporal (0-23)',
      },
      is_recurring: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Apakah transaksi rutin bulanan',
      },
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Tanggal transaksi (YYYY-MM-DD)',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addIndex('transactions', ['user_id']);
    await queryInterface.addIndex('transactions', ['category']);
    await queryInterface.addIndex('transactions', ['date']);
    await queryInterface.addIndex('transactions', ['transaction_type']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('transactions');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_transactions_category";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_transactions_payment_method";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_transactions_transaction_type";');
  },
};
