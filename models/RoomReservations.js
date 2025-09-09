const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const RoomReservations = sequelize.define("room_reservations", {
    RoomReservationID: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    RoomID: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: 'rooms',
            key: 'RoomID'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
    },
    CreatedByUserID: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: 'users',
            key: 'UserID'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    Title: {
        type: DataTypes.STRING(120),
        allowNull: false,
        defaultValue: 'Rezerwacja sali'
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
    Status: {
        type: DataTypes.ENUM('Active', 'Cancelled', 'Finished'),
        allowNull: false,
        defaultValue: 'Active'
    }
}, {
    tableName: "room_reservations",
    timestamps: true,
    paranoid: true,
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt',
    deletedAt: 'DeletedAt',
    indexes: [
        {
            fields: ['RoomID', 'StartTime', 'EndTime'],
            name: 'idx_rr_room_time'
        },
        {
            fields: ['CreatedByUserID', 'StartTime'],
            name: 'idx_rr_user_time'
        },
        {
            fields: ['Status'],
            name: 'idx_rr_status'
        }
    ]
});

module.exports = RoomReservations;
