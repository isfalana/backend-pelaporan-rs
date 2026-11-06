'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('template_tindakan', {
      id_template: {
        type: Sequelize.STRING(50),
        primaryKey: true,
        allowNull: false
      },
      nama_template: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      // Menggunakan tipe data JSON untuk menampung Array ID Tindakan
      list_tindakan: {
        type: Sequelize.JSON, 
        allowNull: false,
        comment: 'Berisi array ID dari tabel tindakan/tindak_lanjut, misal: ["ID1", "ID2"]'
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
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('template_tindakan');
  }
};