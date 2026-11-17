'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('detail_tindakan', {
      id_detail: {
        type: Sequelize.STRING(50),
        primaryKey: true,
        allowNull: false
      },
      
      // Relasi Utama (Ke Laporan & Petugas)
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
        references: { model: 'users', key: 'id_nik' }, // PIC adalah Petugas yang melakukan update
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      
      // BARU: Relasi ke Master Tindak Lanjut
      id_tindak_lanjut: {
        type: Sequelize.STRING(20),
        allowNull: false, // Jika user wajib memilih jenis tindakannya, set ke false
        references: { model: 'tindak_lanjut', key: 'id_tindak_lanjut' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT' // Gunakan RESTRICT agar master tindak lanjut tidak bisa dihapus sembarangan jika sedang digunakan di history
      },

      // Konten Detail
      deskripsi_tindakan: { 
        type: Sequelize.TEXT, 
        allowNull: false 
      },
      file_lampiran: { 
        type: Sequelize.STRING(255), 
        allowNull: true 
      }, // Untuk path gambar
      
      // Timestamp
      created_at: { 
        type: Sequelize.DATE, 
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') 
      },
      updated_at: { 
        type: Sequelize.DATE, 
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') 
      },
      deleted_at: { 
        type: Sequelize.DATE, 
        allowNull: true 
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('detail_tindakan');
  }
};