
'use strict';

module.exports = (sequelize, DataTypes) => {
  const Prioritas = sequelize.define('Prioritas', {
    id_prioritas: {
      type: DataTypes.STRING(20),
      allowNull: false,
      primaryKey: true
    },
    nama_prioritas: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    urutan: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true
    },
    batas_sisa_hari: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'prioritas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
    underscored: true
  });

  Prioritas.associate = (models) => {
    Prioritas.hasMany(models.Laporan, {
      foreignKey: 'id_prioritas',
      as: 'laporan'
    });
  };

  return Prioritas;
};
