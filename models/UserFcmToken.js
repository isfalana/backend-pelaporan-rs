'use strict';

module.exports = (sequelize, DataTypes) => {
  const UserFcmToken = sequelize.define('UserFcmToken', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    id_nik: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    fcm_token: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true
    },
    device_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    platform: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    last_used_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'user_fcm_tokens',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true
  });

  UserFcmToken.associate = (models) => {
    UserFcmToken.belongsTo(models.Users, {
      foreignKey: 'id_nik',
      as: 'user'
    });
  };

  return UserFcmToken;
};