'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('evidence', {
      id_evidence: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      id_laporan: {
        type: Sequelize.UUID,
        allowNull: true,
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
        onDelete: 'CASCADE'
      },
      uploaded_by: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: {
          model: 'users',
          key: 'id_nik'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      original_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      stored_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      file_path: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      mime_type: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      file_size: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addConstraint('evidence', {
      fields: ['id_laporan', 'id_detail_tindakan'],
      type: 'check',
      name: 'chk_evidence_target',
      where: Sequelize.literal(
        '(("id_laporan" IS NOT NULL AND "id_detail_tindakan" IS NULL) OR ' +
        '("id_laporan" IS NULL AND "id_detail_tindakan" IS NOT NULL))'
      )
    });

    await queryInterface.addConstraint('evidence', {
      fields: ['file_size'],
      type: 'check',
      name: 'chk_evidence_file_size',
      where: {
        file_size: {
          [Sequelize.Op.gt]: 0
        }
      }
    });

    await queryInterface.addIndex('evidence', ['id_laporan'], {
      name: 'idx_evidence_laporan'
    });

    await queryInterface.addIndex('evidence', ['id_detail_tindakan'], {
      name: 'idx_evidence_detail_tindakan'
    });

    await queryInterface.addIndex('evidence', ['uploaded_by'], {
      name: 'idx_evidence_uploaded_by'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('evidence');
  }
};
