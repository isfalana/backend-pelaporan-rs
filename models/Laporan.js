'use strict';

module.exports = (sequelize, DataTypes) => {
  const Laporan = sequelize.define('Laporan', {
    id_laporan: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    nomor_laporan: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    tgl_laporan: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    tgl_kejadian: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    id_nik_pelapor: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    id_unit_pelapor: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    id_kategori: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    id_prioritas: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    priority_mode: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'AUTO',
      validate: {
        isIn: [['AUTO', 'MANUAL']]
      }
    },
    deadline: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    perihal: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    keterangan: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'OPEN',
      validate: {
        isIn: [[
          'OPEN',
          'IN_PROGRESS',
          'PENDING_APPROVAL',
          'RETURNED',
          'COMPLETED'
        ]]
      }
    },
    approved_by: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    approval_note: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'laporan',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    paranoid: true,
    underscored: true
  });

  Laporan.associate = (models) => {
    // Identitas pelapor
    Laporan.belongsTo(models.Users, {
      foreignKey: 'id_nik_pelapor',
      as: 'pelapor'
    });

    Laporan.belongsTo(models.Unit, {
      foreignKey: 'id_unit_pelapor',
      as: 'unit_pelapor'
    });

    // Master kategori dan prioritas
    Laporan.belongsTo(models.Kategori, {
      foreignKey: 'id_kategori',
      as: 'kategori'
    });

    Laporan.belongsTo(models.Prioritas, {
      foreignKey: 'id_prioritas',
      as: 'prioritas'
    });

    // Penugasan banyak PIC
    Laporan.hasMany(models.LaporanPic, {
      foreignKey: 'id_laporan',
      as: 'penugasan_pic'
    });

    Laporan.belongsToMany(models.Users, {
      through: models.LaporanPic,
      foreignKey: 'id_laporan',
      otherKey: 'id_nik_pic',
      as: 'pics'
    });

    // Persetujuan penyelesaian oleh pelapor
    Laporan.belongsTo(models.Users, {
      foreignKey: 'approved_by',
      as: 'approver'
    });

    // Checklist tindakan
    Laporan.hasMany(models.DetailTindakan, {
      foreignKey: 'id_laporan',
      as: 'detail_tindakan'
    });

    // Evidence laporan
    Laporan.hasMany(models.Evidence, {
      foreignKey: 'id_laporan',
      as: 'evidence'
    });

    // Riwayat aktivitas laporan
    Laporan.hasMany(models.LaporanHistory, {
      foreignKey: 'id_laporan',
      as: 'history'
    });
  };

  return Laporan;
};