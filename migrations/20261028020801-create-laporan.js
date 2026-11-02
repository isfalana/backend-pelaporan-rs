'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('laporan', {
      id_laporan: {
        type: Sequelize.STRING(50),
        primaryKey: true,
        allowNull: false
      },
      tgl_kejadian: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      
      // --- IDENTITAS PELAPOR ---
      id_unit_pelapor: {
        type: Sequelize.STRING(20), allowNull: false,
        references: { model: 'unit', key: 'id_unit' }, 
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      id_nik_pelapor: { // BARU: Menyimpan NIK siapa spesifik user yang melapor
        type: Sequelize.STRING(50), allowNull: false,
        references: { model: 'users', key: 'id_nik' }, 
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },

      // --- IDENTITAS PIC (TUJUAN) ---
      id_unit_pic: { // BARU: Unit mana yang dituju untuk menyelesaikan masalah
        type: Sequelize.STRING(20), allowNull: false,
        references: { model: 'unit', key: 'id_unit' }, 
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      id_nik_pic: { // BARU: Boleh kosong di awal. Diisi jika unit sudah menugaskan petugas spesifik
        type: Sequelize.STRING(50), allowNull: true,
        references: { model: 'users', key: 'id_nik' }, 
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      
      // --- DATA LAPORAN ---
      id_kategori: {
        type: Sequelize.STRING(20), allowNull: false,
        references: { model: 'kategori', key: 'id_kategori' },
        onUpdate: 'CASCADE', onDelete: 'RESTRICT'
      },
      id_tindak_lanjut: {
        type: Sequelize.STRING(20), allowNull: true,
        references: { model: 'tindak_lanjut', key: 'id_tindak_lanjut' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL'
      },
      
      perihal: { type: Sequelize.TEXT, allowNull: false },
      // prioritas: { type: Sequelize.STRING(20) }, // Low, Medium, High
      keterangan: { type: Sequelize.TEXT },
      bukti: {type: Sequelize.STRING}, //untuk menyimpan url gambar dan lain-lain
      status: { type: Sequelize.STRING(50), defaultValue: 'Pending' },
      tgl_selesai: { type: Sequelize.DATE, allowNull: true },
      
      // --- TRACKING ---
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('laporan');
  }
};