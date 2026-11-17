'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id_nik: {
        type: Sequelize.STRING(50),
        allowNull: false,
        primaryKey: true
      },

      nama_karyawan: {
        type: Sequelize.STRING(150),
        allowNull: false
      },

      password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },

      id_unit: {
        type: Sequelize.STRING(20),
        allowNull: false,
        references: {
          model: 'unit',
          key: 'id_unit'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },

      id_role: {
        type: Sequelize.STRING(20),
        allowNull: false,
        references: {
          model: 'role',
          key: 'id_role'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },

      last_login: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex('users', ['id_unit'], {
      name: 'idx_users_id_unit'
    });

    await queryInterface.addIndex('users', ['id_role'], {
      name: 'idx_users_id_role'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  }
};
