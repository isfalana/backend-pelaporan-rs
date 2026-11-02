module.exports = (sequelize, DataTypes) => {
  const Kategori = sequelize.define('Kategori', {
    id_kategori: { type: DataTypes.STRING(20), primaryKey: true },
    jenis_kategori: DataTypes.STRING(100),
  }, {
    tableName: 'kategori',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
  });
  return Kategori;
};