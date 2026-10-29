'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id_nik: {
        type: Sequelize.STRING(50),
        primaryKey: true,
        allowNull: false
      },
      nama_karyawan: { type: Sequelize.STRING(150), allowNull: false },
      password: { type: Sequelize.STRING(255), allowNull: false },
      jabatan: { type: Sequelize.STRING(100) },
      id_unit: {
        type: Sequelize.STRING(20),
        references: { model: 'unit', key: 'id_unit' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      id_role: {
        type: Sequelize.STRING(20),
        references: { model: 'role', key: 'id_role' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      fcm_token: { type: Sequelize.TEXT },
      last_login: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE, allowNull: true }
    });

    // Menambahkan FK id_nik pada tabel Unit yang mengarah ke tabel Users yang baru saja dibuat
    await queryInterface.addConstraint('unit', {
      fields: ['id_nik'],
      type: 'foreign key',
      name: 'fk_unit_users',
      references: {
        table: 'users',
        field: 'id_nik'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeConstraint('unit', 'fk_unit_users');
    await queryInterface.dropTable('users');
  }
};
