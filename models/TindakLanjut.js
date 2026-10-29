module.exports = (sequelize, DataTypes) => {
  const TindakLanjut = sequelize.define('TindakLanjut', {
    id_tindak_lanjut: { type: DataTypes.STRING(20), primaryKey: true },
    nama_tindak_lanjut: DataTypes.STRING(150),
    deskripsi: DataTypes.TEXT,
  }, {
    tableName: 'tindak_lanjut',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
  });
  return TindakLanjut;
};