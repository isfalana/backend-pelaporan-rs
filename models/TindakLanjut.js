
'use strict';

module.exports = (sequelize, DataTypes) => {
  const TindakLanjut = sequelize.define('TindakLanjut', {
    id_tindak_lanjut: {
      type: DataTypes.STRING(20),
      allowNull: false,
      primaryKey: true
    },
    nama_tindak_lanjut: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true
    },
    deskripsi: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'tindak_lanjut',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
    underscored: true
  });

  return TindakLanjut;
};
