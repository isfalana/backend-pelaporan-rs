'use strict';

module.exports = (sequelize, DataTypes) => {
  const DetailTindakan = sequelize.define('DetailTindakan', {
    id_detail_tindakan: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    id_laporan: {
      type: DataTypes.UUID,
      allowNull: false
    },
    id_template_detail: {
      type: DataTypes.UUID,
      allowNull: true
    },
    nama_tindakan: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    sumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'MANUAL',
      validate: {
        isIn: [['MANUAL', 'TEMPLATE']]
      }
    },
    urutan: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    is_completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    catatan: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_by: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    updated_by: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    completed_by: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'detail_tindakan',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
    underscored: true
  });

  DetailTindakan.associate = (models) => {
    DetailTindakan.belongsTo(models.Laporan, {
      foreignKey: 'id_laporan',
      as: 'laporan'
    });

    DetailTindakan.belongsTo(models.TemplateTindakanDetail, {
      foreignKey: 'id_template_detail',
      as: 'template_detail'
    });

    DetailTindakan.belongsTo(models.Users, {
      foreignKey: 'created_by',
      as: 'creator'
    });

    DetailTindakan.belongsTo(models.Users, {
      foreignKey: 'updated_by',
      as: 'updater'
    });

    DetailTindakan.belongsTo(models.Users, {
      foreignKey: 'completed_by',
      as: 'completer'
    });

    DetailTindakan.hasMany(models.Evidence, {
      foreignKey: 'id_detail_tindakan',
      as: 'evidence'
    });

    DetailTindakan.hasMany(models.LaporanHistory, {
      foreignKey: 'id_detail_tindakan',
      as: 'history'
    });
  };

  return DetailTindakan;
};
