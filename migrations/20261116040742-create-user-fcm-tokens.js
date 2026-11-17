'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_fcm_tokens', {
      id_fcm: {
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

      fcm_token: {
        type: Sequelize.TEXT,
        allowNull: false,
        unique: true
      },

      device_id: {
        type: Sequelize.STRING(255),
        allowNull: true
      },

      platform: {
        type: Sequelize.STRING(30),
        allowNull: true
      },

      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },

      last_used_at: {
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
      'user_fcm_tokens',
      ['id_nik'],
      { name: 'idx_user_fcm_tokens_id_nik' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('user_fcm_tokens');
  }
};
