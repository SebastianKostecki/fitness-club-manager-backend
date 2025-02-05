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
        allowNull: false
    },
    Email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
    },
    Role: {
        type: DataTypes.STRING(100),
        allowNull: false
    }
}, {
    // Opcje tabeli
    tableName: 'users',
    timestamps: false
});

module.exports = Users;
