'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('laporan', {
      id_laporan: {
        type: Sequelize.STRING(50),
        primaryKey: true,
        allowNull: false
      },
      tgl_laporan: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      id_unit_pelapor: {
        type: Sequelize.STRING(20),
        allowNull: false,
        references: { model: 'unit', key: 'id_unit' }, // Berelasi ke Unit yang melapor
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      id_kategori: {
        type: Sequelize.STRING(20),
        allowNull: false,
        references: { model: 'kategori', key: 'id_kategori' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      id_tindak_lanjut: {
        type: Sequelize.STRING(20),
        allowNull: true,
        references: { model: 'tindak_lanjut', key: 'id_tindak_lanjut' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      perihal: { type: Sequelize.TEXT, allowNull: false },
      prioritas: { type: Sequelize.STRING(20) }, // Low, Medium, High
      keterangan: { type: Sequelize.TEXT },
      status: { type: Sequelize.STRING(50), defaultValue: 'Pending' },
      tgl_selesai: { type: Sequelize.DATE, allowNull: true },
      
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('laporan');
  }
};
