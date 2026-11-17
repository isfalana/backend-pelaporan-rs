'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('prioritas', {
      id_prioritas: {
        type: Sequelize.STRING(20),
        allowNull: false,
        primaryKey: true
      },

      nama_prioritas: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },

      urutan: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true
      },

      batas_sisa_hari: {
        type: Sequelize.INTEGER,
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

    await queryInterface.addIndex(
      'prioritas',
      ['is_active', 'urutan'],
      { name: 'idx_prioritas_active_urutan' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('prioritas');
  }
};
