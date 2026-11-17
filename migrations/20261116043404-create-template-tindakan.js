'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('template_tindakan', {
      id_template: {
        type: Sequelize.STRING(20),
        allowNull: false,
        primaryKey: true
      },

      nama_template: {
        type: Sequelize.STRING(150),
        allowNull: false
      },

      deskripsi: {
        type: Sequelize.TEXT,
        allowNull: true
      },

      id_kategori: {
        type: Sequelize.STRING(20),
        allowNull: true,
        references: {
          model: 'kategori',
          key: 'id_kategori'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },

      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },

      created_by: {
        type: Sequelize.STRING(50),
        allowNull: true,
        references: {
          model: 'users',
          key: 'id_nik'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
      'template_tindakan',
      ['id_kategori'],
      { name: 'idx_template_tindakan_kategori' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('template_tindakan');
  }
};