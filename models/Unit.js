'use strict';

module.exports = (sequelize, DataTypes) => {
  const Unit = sequelize.define('Unit', {
    id_unit: {
      type: DataTypes.STRING(20),
      allowNull: false,
      primaryKey: true
    },
    nama_unit: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true
    }
  }, {
    tableName: 'unit',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
    underscored: true
  });

  Unit.associate = (models) => {
    Unit.hasMany(models.Users, {
      foreignKey: 'id_unit',
      as: 'users'
    });

    Unit.hasMany(models.Laporan, {
      foreignKey: 'id_unit_pelapor',
      as: 'laporan'
    });
  };

  return Unit;
};
