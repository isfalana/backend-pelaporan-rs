'use strict';

module.exports = (sequelize, DataTypes) => {
  const Users = sequelize.define('Users', {
    id_nik: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true
    },
    nama_karyawan: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    id_unit: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    id_role: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
    underscored: true
  });

  Users.associate = (models) => {
    // Relasi master unit dan role
    Users.belongsTo(models.Unit, {
      foreignKey: 'id_unit',
      as: 'unit'
    });

    Users.belongsTo(models.Role, {
      foreignKey: 'id_role',
      as: 'role'
    });

    // Laporan yang dibuat oleh user
    Users.hasMany(models.Laporan, {
      foreignKey: 'id_nik_pelapor',
      as: 'laporan_dibuat'
    });

    // Laporan tempat user ditugaskan sebagai PIC
    Users.belongsToMany(models.Laporan, {
      through: models.LaporanPic,
      foreignKey: 'id_nik_pic',
      otherKey: 'id_laporan',
      as: 'laporan_pic'
    });

    Users.hasMany(models.LaporanPic, {
      foreignKey: 'id_nik_pic',
      as: 'penugasan_pic'
    });

    // Penugasan PIC yang dibuat oleh user
    Users.hasMany(models.LaporanPic, {
      foreignKey: 'assigned_by',
      as: 'penugasan_dibuat'
    });

    // FCM dan sesi login
    Users.hasMany(models.UserFcmToken, {
      foreignKey: 'id_nik',
      as: 'fcm_tokens'
    });

    Users.hasMany(models.UserSession, {
      foreignKey: 'id_nik',
      as: 'sessions'
    });

    // Evidence yang diunggah
    Users.hasMany(models.Evidence, {
      foreignKey: 'uploaded_by',
      as: 'uploaded_evidence'
    });

    // Tindakan yang dibuat, diperbarui, dan diselesaikan
    Users.hasMany(models.DetailTindakan, {
      foreignKey: 'created_by',
      as: 'tindakan_dibuat'
    });

    Users.hasMany(models.DetailTindakan, {
      foreignKey: 'updated_by',
      as: 'tindakan_diperbarui'
    });

    Users.hasMany(models.DetailTindakan, {
      foreignKey: 'completed_by',
      as: 'tindakan_diselesaikan'
    });

    // Riwayat aktivitas user
    Users.hasMany(models.LaporanHistory, {
      foreignKey: 'actor_id',
      as: 'aktivitas'
    });
  };

  return Users;
};
