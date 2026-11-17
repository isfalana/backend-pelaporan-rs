'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_sessions', {
      id_session: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },

      id_nik: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: {
          model: 'users',
          key: 'id_nik'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },

      jti: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },

      refresh_token_hash: {
        type: Sequelize.STRING(255),
        allowNull: false
      },

      device_id: {
        type: Sequelize.STRING(255),
        allowNull: true
      },

      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true
      },

      ip_address: {
        type: Sequelize.INET,
        allowNull: true
      },

      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },

      revoked_at: {
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
      }
    });

    await queryInterface.addIndex(
      'user_sessions',
      ['id_nik'],
      { name: 'idx_user_sessions_id_nik' }
    );

    await queryInterface.addIndex(
      'user_sessions',
      ['expires_at'],
      { name: 'idx_user_sessions_expires_at' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('user_sessions');
  }
};
