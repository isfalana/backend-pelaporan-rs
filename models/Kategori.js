'use strict';

module.exports = (sequelize, DataTypes) => {
  const Kategori = sequelize.define('Kategori', {
    id_kategori: {
      type: DataTypes.STRING(20),
      allowNull: false,
      primaryKey: true
    },
    nama_kategori: {
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
    tableName: 'kategori',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
    underscored: true
  });

  Kategori.associate = (models) => {
    Kategori.hasMany(models.Laporan, {
      foreignKey: 'id_kategori',
      as: 'laporan'
    });

    Kategori.hasMany(models.TemplateTindakan, {
      foreignKey: 'id_kategori',
      as: 'templates'
    });
  };

  return Kategori;
};
