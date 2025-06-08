const { DataTypes } = require('sequelize');
const sequelize = require("../config/sequelize");

const FitnessClasses = sequelize.define("fitness_classes", {
    ClassID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
    },
    TrainerID: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    RoomID: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    Title: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    StartTime: {
        type: DataTypes.DATE,
        allowNull: true
    },
    EndTime: {
        type: DataTypes.DATE,
        allowNull: true
    },
    Capacity: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    Status: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: "Active"
    }
}, {
    tableName: 'fitness_classes',
    timestamps: false
});

module.exports = FitnessClasses;
