'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('prediction_logs', {
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
        comment: 'ID pengguna pemilik log prediksi',
      },
      input_text: {
        type: Sequelize.STRING(500),
        allowNull: false,
        comment: 'Teks deskripsi yang di-input user',
      },
      predicted_category: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'Kategori hasil prediksi AI/rule-based',
      },
      confidence: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: true,
        comment: 'Skor kepercayaan prediksi (0.00 - 1.00)',
      },
      model_version: {
        type: Sequelize.STRING(20),
        allowNull: true,
        defaultValue: 'rule-v1',
        comment: 'Versi model yang digunakan',
      },
      user_overridden: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Apakah user mengganti prediksi?',
      },
      final_category: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Kategori akhir yang dipakai (bisa sama atau beda dengan prediksi)',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addIndex('prediction_logs', ['user_id']);
    await queryInterface.addIndex('prediction_logs', ['predicted_category']);
    await queryInterface.addIndex('prediction_logs', ['created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('prediction_logs');
  },
};
