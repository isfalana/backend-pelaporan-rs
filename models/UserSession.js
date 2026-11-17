'use strict';

module.exports = (sequelize, DataTypes) => {
  const UserSession = sequelize.define('UserSession', {
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
    jti: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    refresh_token_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    device_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ip_address: {
      type: DataTypes.INET,
      allowNull: true
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'user_sessions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true
  });

  UserSession.associate = (models) => {
    UserSession.belongsTo(models.Users, {
      foreignKey: 'id_nik',
      as: 'user'
    });
  };

  return UserSession;
};