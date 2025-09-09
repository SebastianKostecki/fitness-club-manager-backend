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
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
            model: 'users',
            key: 'UserID'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
    },
    RoomID: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: {
            model: 'rooms',
            key: 'RoomID'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
    },
    Title: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    StartTime: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
            isDate: true
        }
    },
    EndTime: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
            isDate: true,
            isAfterStart(value) {
                if (this.StartTime && new Date(value) <= new Date(this.StartTime)) {
                    throw new Error('End time must be after start time');
                }
            }
        }
    },
    Capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 100
        }
    },
    Status: {
        type: DataTypes.ENUM('Active', 'Cancelled', 'Completed', 'Draft'),
        allowNull: false,
        defaultValue: "Active"
    }
}, {
    tableName: 'fitness_classes',
    timestamps: true,
    paranoid: true,
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt',
    deletedAt: 'DeletedAt',
    indexes: [
        {
            fields: ['TrainerID'],
            name: 'idx_fitness_classes_trainer'
        },
        {
            fields: ['RoomID'],
            name: 'idx_fitness_classes_room'
        },
        {
            fields: ['StartTime'],
            name: 'idx_fitness_classes_start_time'
        },
        {
            fields: ['Status'],
            name: 'idx_fitness_classes_status'
        },
        {
            fields: ['RoomID', 'StartTime', 'EndTime'],
            name: 'idx_class_time_room'
        }
    ]
});

module.exports = FitnessClasses;
