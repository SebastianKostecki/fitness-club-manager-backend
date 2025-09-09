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
        allowNull: false,
        validate: {
            min: 1,
            max: 1000
        }
    },
    Location: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    }
}, {
    tableName: 'rooms',
    timestamps: true,
    paranoid: true,
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt',
    deletedAt: 'DeletedAt'
});

module.exports = Rooms;
