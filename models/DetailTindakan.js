module.exports = (sequelize, DataTypes) => {
  const DetailTindakan = sequelize.define('DetailTindakan', {
    id_detail: { type: DataTypes.STRING(50), primaryKey: true },
    id_laporan: DataTypes.STRING(50),
    id_nik_pic: DataTypes.STRING(50),
    deskripsi_tindakan: DataTypes.TEXT,
    file_lampiran: DataTypes.STRING(255),
  }, {
    tableName: 'detail_tindakan',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
  });

  DetailTindakan.associate = (models) => {
    DetailTindakan.belongsTo(models.Laporan, { foreignKey: 'id_laporan', as: 'laporan' });
    DetailTindakan.belongsTo(models.Users, { foreignKey: 'id_nik_pic', as: 'pic' });
  };
  return DetailTindakan;
};