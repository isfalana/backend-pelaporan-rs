'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // [MODIFIKASI] Migration penambahan kolom permissions ke tabel role
    const tableInfo = await queryInterface.describeTable('role');
    if (!tableInfo.permissions) {
      await queryInterface.addColumn('role', 'permissions', {
        type: Sequelize.JSONB,
        allowNull: true
      });
    }
  },

  async down(queryInterface) {
    const tableInfo = await queryInterface.describeTable('role');
    if (tableInfo.permissions) {
      await queryInterface.removeColumn('role', 'permissions');
    }
  }
};
