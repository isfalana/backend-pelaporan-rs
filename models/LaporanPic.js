'use strict';

module.exports = (sequelize, DataTypes) => {
  const LaporanPic = sequelize.define('LaporanPic', {
    id_laporan: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true
    },
    id_nik_pic: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true
    },
    assigned_by: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    assigned_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'laporan_pic',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    underscored: true
  });

  LaporanPic.associate = (models) => {
    LaporanPic.belongsTo(models.Laporan, {
      foreignKey: 'id_laporan',
      as: 'laporan'
    });

    LaporanPic.belongsTo(models.Users, {
      foreignKey: 'id_nik_pic',
      as: 'pic'
    });

    LaporanPic.belongsTo(models.Users, {
      foreignKey: 'assigned_by',
      as: 'pemberi_tugas'
    });
  };

  return LaporanPic;
};