const { DataTypes } = require('sequelize');
const sequelize = require("../config/sequelize");

const Users = sequelize.define("users", {
    UserID: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    Username: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
    },
    Password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            len: [8, 255]
        }
    },
    Email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    Role: {
        type: DataTypes.STRING(100),
        allowNull: false
    }
}, {
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt',
    deletedAt: 'DeletedAt',
    indexes: [
        {
            fields: ['Email'],
            name: 'idx_users_email'
        }
    ]
});

module.exports = Users;
