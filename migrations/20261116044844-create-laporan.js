'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('laporan', {
      id_laporan: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      nomor_laporan: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      tgl_laporan: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      tgl_kejadian: {
        type: Sequelize.DATE,
        allowNull: false
      },
      id_nik_pelapor: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: {
          model: 'users',
          key: 'id_nik'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      id_unit_pelapor: {
        type: Sequelize.STRING(20),
        allowNull: false,
        references: {
          model: 'unit',
          key: 'id_unit'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      id_kategori: {
        type: Sequelize.STRING(20),
        allowNull: false,
        references: {
          model: 'kategori',
          key: 'id_kategori'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      id_prioritas: {
        type: Sequelize.STRING(20),
        allowNull: false,
        references: {
          model: 'prioritas',
          key: 'id_prioritas'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      priority_mode: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'AUTO'
      },
      deadline: {
        type: Sequelize.DATE,
        allowNull: false
      },
      perihal: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      keterangan: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.STRING(40),
        allowNull: false,
        defaultValue: 'OPEN'
      },
      approved_by: {
        type: Sequelize.STRING(50),
        allowNull: true,
        references: {
          model: 'users',
          key: 'id_nik'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      approval_note: {
        type: Sequelize.TEXT,
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

    await queryInterface.addConstraint('laporan', {
      fields: ['priority_mode'],
      type: 'check',
      name: 'chk_laporan_priority_mode',
      where: {
        priority_mode: ['AUTO', 'MANUAL']
      }
    });

    await queryInterface.addConstraint('laporan', {
      fields: ['status'],
      type: 'check',
      name: 'chk_laporan_status',
      where: {
        status: [
          'OPEN',
          'IN_PROGRESS',
          'PENDING_APPROVAL',
          'RETURNED',
          'COMPLETED'
        ]
      }
    });

    await queryInterface.addIndex('laporan', ['id_nik_pelapor'], {
      name: 'idx_laporan_pelapor'
    });

    await queryInterface.addIndex('laporan', ['id_unit_pelapor'], {
      name: 'idx_laporan_unit_pelapor'
    });

    await queryInterface.addIndex('laporan', ['id_kategori'], {
      name: 'idx_laporan_kategori'
    });

    await queryInterface.addIndex('laporan', ['id_prioritas'], {
      name: 'idx_laporan_prioritas'
    });

    await queryInterface.addIndex('laporan', ['status'], {
      name: 'idx_laporan_status'
    });

    await queryInterface.addIndex('laporan', ['deadline'], {
      name: 'idx_laporan_deadline'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('laporan');
  }
};
