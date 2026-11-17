'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('template_tindakan_detail', {
      id_template_detail: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },

      id_template: {
        type: Sequelize.STRING(20),
        allowNull: false,
        references: {
          model: 'template_tindakan',
          key: 'id_template'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },

      urutan: {
        type: Sequelize.INTEGER,
        allowNull: false
      },

      nama_tindakan: {
        type: Sequelize.TEXT,
        allowNull: false
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

    await queryInterface.addIndex(
      'template_tindakan_detail',
      ['id_template', 'urutan'],
      {
        name: 'idx_template_detail_urutan',
        unique: true
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('template_tindakan_detail');
  }
};
