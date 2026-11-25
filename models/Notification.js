'use strict';

// [MODIFIKASI] Model Notification untuk mencatat notifikasi user (Web, Desktop, Mobile)
module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id_notification: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    id_nik: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    id_laporan: {
      type: DataTypes.UUID,
      allowNull: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true
  });

  Notification.associate = (models) => {
    Notification.belongsTo(models.Users, {
      foreignKey: 'id_nik',
      as: 'user'
    });

    Notification.belongsTo(models.Laporan, {
      foreignKey: 'id_laporan',
      as: 'laporan'
    });
  };

  return Notification;
};
