'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('tindak_lanjut', {
      id_tindak_lanjut: {
        type: Sequelize.STRING(20),
        primaryKey: true,
        allowNull: false
      },
      nama_tindak_lanjut: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      deskripsi: { type: Sequelize.TEXT },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('tindak_lanjut');
  }
};
