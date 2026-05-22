'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Hashed password (bcrypt)',
      },
      monthly_income: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Pemasukan bulanan user (Rp)',
      },
      initial_balance: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Saldo awal user',
      },
      age: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      occupation: {
        type: Sequelize.ENUM('mahasiswa', 'karyawan', 'freelancer', 'wirausaha', 'lainnya'),
        allowNull: false,
        defaultValue: 'karyawan',
      },
      financial_goal: {
        type: Sequelize.ENUM('hemat', 'investasi', 'bebas_utang', 'dana_darurat'),
        allowNull: false,
        defaultValue: 'dana_darurat',
      },
      risk_profile: {
        type: Sequelize.ENUM('konservatif', 'moderat', 'agresif'),
        allowNull: false,
        defaultValue: 'konservatif',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_occupation";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_financial_goal";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_risk_profile";');
  },
};
