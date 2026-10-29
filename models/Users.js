module.exports = (sequelize, DataTypes) => {
  const Users = sequelize.define('Users', {
    id_nik: { type: DataTypes.STRING(50), primaryKey: true },
    nama_karyawan: DataTypes.STRING(150),
    password: DataTypes.STRING(255),
    jabatan: DataTypes.STRING(100),
    id_unit: DataTypes.STRING(20),
    id_role: DataTypes.STRING(20),
    fcm_token: DataTypes.TEXT,
    last_login: DataTypes.DATE,
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
  });

  // Mendefinisikan Relasi JOIN
  Users.associate = (models) => {
    // Satu User berasal dari satu Unit
    Users.belongsTo(models.Unit, {
      foreignKey: 'id_unit',
      as: 'unitData' // Alias saat data ditampilkan nanti
    });
    
    // Satu User memiliki satu Role
    Users.belongsTo(models.Role, {
      foreignKey: 'id_role',
      as: 'roleData'
    });
  };

  return Users;
};