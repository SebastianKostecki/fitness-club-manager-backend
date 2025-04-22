const { DataTypes } = require('sequelize');
const sequelize = require("../config/sequelize");

const Rooms = sequelize.define("rooms", {
    RoomID: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    RoomName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
    },
    Capacity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    Location: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    }
    
}, {
    // Opcje tabeli
    tableName: 'rooms',
    timestamps: false
});

module.exports = Rooms;
