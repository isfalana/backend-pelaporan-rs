'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('detail_tindakan', {
      id_detail_tindakan: {
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
      id_template_detail: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'template_tindakan_detail',
          key: 'id_template_detail'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      nama_tindakan: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      sumber: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'MANUAL'
      },
      urutan: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      is_completed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      catatan: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      created_by: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: {
          model: 'users',
          key: 'id_nik'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      updated_by: {
        type: Sequelize.STRING(50),
        allowNull: true,
        references: {
          model: 'users',
          key: 'id_nik'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      completed_by: {
        type: Sequelize.STRING(50),
        allowNull: true,
        references: {
          model: 'users',
          key: 'id_nik'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      completed_at: {
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

    await queryInterface.addConstraint('detail_tindakan', {
      fields: ['sumber'],
      type: 'check',
      name: 'chk_detail_tindakan_sumber',
      where: {
        sumber: ['MANUAL', 'TEMPLATE']
      }
    });

    await queryInterface.addIndex(
      'detail_tindakan',
      ['id_laporan', 'urutan'],
      { name: 'idx_detail_tindakan_laporan_urutan' }
    );

    await queryInterface.addIndex(
      'detail_tindakan',
      ['id_template_detail'],
      { name: 'idx_detail_tindakan_template_detail' }
    );

    await queryInterface.addIndex(
      'detail_tindakan',
      ['is_completed'],
      { name: 'idx_detail_tindakan_is_completed' }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('detail_tindakan');
  }
};
