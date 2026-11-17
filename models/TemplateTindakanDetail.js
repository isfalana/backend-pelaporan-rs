'use strict';

module.exports = (sequelize, DataTypes) => {
  const TemplateTindakanDetail = sequelize.define('TemplateTindakanDetail', {
    id_template_detail: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    id_template: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    urutan: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    nama_tindakan: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    tableName: 'template_tindakan_detail',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true
  });

  TemplateTindakanDetail.associate = (models) => {
    TemplateTindakanDetail.belongsTo(models.TemplateTindakan, {
      foreignKey: 'id_template',
      as: 'template'
    });

    TemplateTindakanDetail.hasMany(models.DetailTindakan, {
      foreignKey: 'id_template_detail',
      as: 'detail_tindakan'
    });
  };

  return TemplateTindakanDetail;
};