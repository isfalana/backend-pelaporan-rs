'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tindak_lanjut', {
      id_tindak_lanjut: {
        type: Sequelize.STRING(20),
        allowNull: false,
        primaryKey: true
      },

      nama_tindak_lanjut: {
        type: Sequelize.STRING(150),
        allowNull: false,
        unique: true
      },

      deskripsi: {
        type: Sequelize.TEXT,
        allowNull: true
      },

      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },

      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('tindak_lanjut');
  }
};