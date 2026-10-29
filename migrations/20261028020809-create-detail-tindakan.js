'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('detail_tindakan', {
      id_detail: {
        type: Sequelize.STRING(50),
        primaryKey: true,
        allowNull: false
      },
      id_laporan: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: { model: 'laporan', key: 'id_laporan' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      id_nik_pic: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: { model: 'users', key: 'id_nik' }, // PIC adalah Petugas (User)
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      deskripsi_tindakan: { type: Sequelize.TEXT, allowNull: false },
      file_lampiran: { type: Sequelize.STRING(255), allowNull: true }, // Untuk path gambar
      
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('detail_tindakan');
  }
};
