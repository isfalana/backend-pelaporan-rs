module.exports = (sequelize, DataTypes) => {
  const Laporan = sequelize.define('Laporan', {
    id_laporan: { type: DataTypes.STRING(50), primaryKey: true },
    tgl_laporan: DataTypes.DATE,
    
    id_unit_pelapor: DataTypes.STRING(20),
    id_nik_pelapor: DataTypes.STRING(50), // BARU
    
    id_unit_pic: DataTypes.STRING(20),    // BARU
    id_nik_pic: DataTypes.STRING(50),     // BARU
    
    id_kategori: DataTypes.STRING(20),
    id_tindak_lanjut: DataTypes.STRING(20),
    perihal: DataTypes.TEXT,
    prioritas: DataTypes.STRING(20),
    keterangan: DataTypes.TEXT,
    status: DataTypes.STRING(50),
    tgl_selesai: DataTypes.DATE,
  }, {
    tableName: 'laporan',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
  });

  Laporan.associate = (models) => {
    // Relasi untuk Data Pelapor (Menarik Nama Unit & Nama User)
    Laporan.belongsTo(models.Unit, { foreignKey: 'id_unit_pelapor', as: 'unit_pelapor' });
    Laporan.belongsTo(models.Users, { foreignKey: 'id_nik_pelapor', as: 'user_pelapor' });
    
    // Relasi untuk Data PIC Tujuan (Menarik Nama Unit & Nama User)
    Laporan.belongsTo(models.Unit, { foreignKey: 'id_unit_pic', as: 'unit_pic' });
    Laporan.belongsTo(models.Users, { foreignKey: 'id_nik_pic', as: 'user_pic' });

    // Relasi Master Lainnya
    Laporan.belongsTo(models.Kategori, { foreignKey: 'id_kategori', as: 'kategori' });
    Laporan.belongsTo(models.TindakLanjut, { foreignKey: 'id_tindak_lanjut', as: 'tindak_lanjut' });
    
    // Relasi Log Riwayat (One-to-Many)
    Laporan.hasMany(models.DetailTindakan, { foreignKey: 'id_laporan', as: 'riwayat_tindakan' });
  };
  return Laporan;
};