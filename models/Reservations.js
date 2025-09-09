const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const Reservations = sequelize.define("reservations", {
    ReservationID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    UserID: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: 'users',
            key: 'UserID'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    Status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'attended', 'no_show'),
        allowNull: false,
        defaultValue: 'pending'
    },
    ClassID: {
        type: DataTypes.INTEGER,
        allowNull: false, // Changed to NOT NULL for class reservations
        references: {
            model: 'fitness_classes',
            key: 'ClassID'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    }
}, {
    tableName: "reservations",
    timestamps: true,
    paranoid: true,
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt',
    deletedAt: 'DeletedAt',
    indexes: [
        {
            fields: ['UserID'],
            name: 'idx_reservations_user'
        },
        {
            fields: ['ClassID'],
            name: 'idx_reservations_class'
        },
        {
            fields: ['Status'],
            name: 'idx_reservations_status'
        },
        {
            fields: ['UserID', 'Status'],
            name: 'idx_reservations_user_status'
        }
    ]
});

module.exports = Reservations;
