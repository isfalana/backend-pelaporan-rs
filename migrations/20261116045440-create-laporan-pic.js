'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('laporan_pic', {
      id_laporan: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'laporan',
          key: 'id_laporan'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      id_nik_pic: {
        type: Sequelize.STRING(50),
        allowNull: false,
        primaryKey: true,
        references: {
          model: 'users',
          key: 'id_nik'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      assigned_by: {
        type: Sequelize.STRING(50),
        allowNull: false,
        references: {
          model: 'users',
          key: 'id_nik'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      assigned_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('laporan_pic', ['id_nik_pic'], {
      name: 'idx_laporan_pic_id_nik_pic'
    });

    await queryInterface.addIndex('laporan_pic', ['assigned_by'], {
      name: 'idx_laporan_pic_assigned_by'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('laporan_pic');
  }
};
