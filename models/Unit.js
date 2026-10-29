module.exports = (sequelize, DataTypes) => {
  const Unit = sequelize.define('Unit', {
    id_unit: { type: DataTypes.STRING(20), primaryKey: true },
    nama_unit: DataTypes.STRING(100),
    id_nik: DataTypes.STRING(50), 
  }, {
    tableName: 'unit',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
  });

  return Unit;
};