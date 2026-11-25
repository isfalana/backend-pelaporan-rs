'use strict';

module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
    id_role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      primaryKey: true
    },
    nama_role: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    deskripsi: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // [MODIFIKASI] Menambahkan kolom permissions untuk menyimpan hak akses role (JSONB)
    permissions: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'role',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
    underscored: true
  });

  Role.associate = (models) => {
    Role.hasMany(models.Users, {
      foreignKey: 'id_role',
      as: 'users'
    });
  };

  return Role;
};
