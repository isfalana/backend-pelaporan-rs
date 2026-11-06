'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TemplateTindakan extends Model {
    static associate(models) {
      // Jika list_tindakan berupa JSON array, relasi fisik (belongsToMany) biasanya 
      // tidak dideklarasikan di sini. Pengambilan data detail tindakan dilakukan 
      // melalui query manual (Op.in) di controller saat template dipanggil.
    }
  }

  TemplateTindakan.init({
    id_template: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      allowNull: false
    },
    nama_template: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    list_tindakan: {
      type: DataTypes.JSON,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'TemplateTindakan',
    tableName: 'template_tindakan',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return TemplateTindakan;
};