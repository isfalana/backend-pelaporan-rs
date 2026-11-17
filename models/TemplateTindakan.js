'use strict';

module.exports = (sequelize, DataTypes) => {
  const TemplateTindakan = sequelize.define('TemplateTindakan', {
    id_template: {
      type: DataTypes.STRING(20),
      allowNull: false,
      primaryKey: true
    },
    nama_template: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    deskripsi: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    id_kategori: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    created_by: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    tableName: 'template_tindakan',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
    underscored: true
  });

  TemplateTindakan.associate = (models) => {
    TemplateTindakan.belongsTo(models.Kategori, {
      foreignKey: 'id_kategori',
      as: 'kategori'
    });

    TemplateTindakan.belongsTo(models.Users, {
      foreignKey: 'created_by',
      as: 'creator'
    });

    TemplateTindakan.hasMany(models.TemplateTindakanDetail, {
      foreignKey: 'id_template',
      as: 'details'
    });
  };

  return TemplateTindakan;
};
