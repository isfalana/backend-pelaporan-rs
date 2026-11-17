'use strict';

module.exports = (sequelize, DataTypes) => {
  const LaporanHistory = sequelize.define('LaporanHistory', {
    id_history: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    id_laporan: {
      type: DataTypes.UUID,
      allowNull: false
    },
    id_detail_tindakan: {
      type: DataTypes.UUID,
      allowNull: true
    },
    actor_id: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    actor_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'USER',
      validate: {
        isIn: [['USER', 'SYSTEM']]
      }
    },
    activity_type: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    old_value: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    new_value: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'laporan_history',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    underscored: true
  });

  LaporanHistory.associate = (models) => {
    LaporanHistory.belongsTo(models.Laporan, {
      foreignKey: 'id_laporan',
      as: 'laporan'
    });

    LaporanHistory.belongsTo(models.DetailTindakan, {
      foreignKey: 'id_detail_tindakan',
      as: 'detail_tindakan'
    });

    LaporanHistory.belongsTo(models.Users, {
      foreignKey: 'actor_id',
      as: 'actor'
    });
  };

  return LaporanHistory;
};