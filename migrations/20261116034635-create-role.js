'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('role', {
      id_role: {
        type: Sequelize.STRING(20),
        allowNull: false,
        primaryKey: true
      },
      nama_role: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      deskripsi: {
        type: Sequelize.TEXT,
        allowNull: true
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

    await queryInterface.bulkInsert('role', [
      {
        id_role: 'R-01',
        nama_role: 'Admin',
        deskripsi: 'Administrator aplikasi',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id_role: 'R-02',
        nama_role: 'User',
        deskripsi: 'Pengguna aplikasi dan dapat menjadi PIC laporan',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('role');
  }
};
