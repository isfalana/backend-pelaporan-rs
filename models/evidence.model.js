
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Evidence = sequelize.define('Evidence', {
    id_evidence: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    id_laporan: {
      type: DataTypes.UUID,
      allowNull: true
    },
    id_detail_tindakan: {
      type: DataTypes.UUID,
      allowNull: true
    },
    uploaded_by: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    original_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    stored_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    file_path: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    file_size: {
      type: DataTypes.BIGINT,
      allowNull: false
    }
  }, {
    tableName: 'evidence',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    underscored: true
  });

  Evidence.associate = (models) => {
    Evidence.belongsTo(models.Laporan, {
      foreignKey: 'id_laporan',
      as: 'laporan'
    });

    Evidence.belongsTo(models.DetailTindakan, {
      foreignKey: 'id_detail_tindakan',
      as: 'detail_tindakan'
    });

    Evidence.belongsTo(models.Users, {
      foreignKey: 'uploaded_by',
      as: 'pengunggah'
    });
  };

  return Evidence;
};