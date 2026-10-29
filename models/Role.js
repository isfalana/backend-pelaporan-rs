module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
    id_role: { type: DataTypes.STRING(20), primaryKey: true },
    nama_role: DataTypes.STRING(50),
  }, {
    tableName: 'role',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true, // Untuk mengaktifkan Soft Delete (deleted_at)
  });

  return Role;
};