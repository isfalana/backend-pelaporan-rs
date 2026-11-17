'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('laporan_history', {
      id_history: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      id_laporan: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'laporan',
          key: 'id_laporan'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      id_detail_tindakan: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'detail_tindakan',
          key: 'id_detail_tindakan'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      actor_id: {
        type: Sequelize.STRING(50),
        allowNull: true,
        references: {
          model: 'users',
          key: 'id_nik'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      actor_type: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'USER'
      },
      activity_type: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      old_value: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      new_value: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addConstraint('laporan_history', {
      fields: ['actor_type'],
      type: 'check',
      name: 'chk_laporan_history_actor_type',
      where: {
        actor_type: ['USER', 'SYSTEM']
      }
    });

    await queryInterface.addIndex(
      'laporan_history',
      ['id_laporan', 'created_at'],
      { name: 'idx_laporan_history_laporan_created' }
    );

    await queryInterface.addIndex(
      'laporan_history',
      ['id_detail_tindakan'],
      { name: 'idx_laporan_history_detail_tindakan' }
    );

    await queryInterface.addIndex(
      'laporan_history',
      ['actor_id'],
      { name: 'idx_laporan_history_actor' }
    );

    await queryInterface.addIndex(
      'laporan_history',
      ['activity_type'],
      { name: 'idx_laporan_history_activity_type' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('laporan_history');
  }
};
