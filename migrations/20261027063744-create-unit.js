'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('unit', {
      id_unit: {
        type: Sequelize.STRING(20),
        primaryKey: true,
        allowNull: false
      },
      nama_unit: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      id_nik: { // Dibiarkan tanpa FK dulu untuk menghindari error circular
        type: Sequelize.STRING(50),
        allowNull: true
      },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('unit');
  }
};
