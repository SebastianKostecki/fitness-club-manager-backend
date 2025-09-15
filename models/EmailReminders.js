const { DataTypes } = require('sequelize');
const sequelize = require("../config/sequelize");

const EmailReminders = sequelize.define("email_reminders", {
    EmailReminderID: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    ReservationID: {
        type: DataTypes.INTEGER,
        allowNull: true,  // Nullable for room reservations
        references: {
            model: 'reservations',
            key: 'ReservationID'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
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
    ClassID: {
        type: DataTypes.INTEGER,
        allowNull: true,  // Now optional - for fitness class reminders
        references: {
            model: 'fitness_classes',
            key: 'ClassID'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    RoomReservationID: {
        type: DataTypes.BIGINT,
        allowNull: true,  // Optional - for room reservation reminders
        references: {
            model: 'room_reservations',
            key: 'RoomReservationID'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
    },
    ScheduledTime: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'When to send the reminder (1 hour before class)'
    },
    SentAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When the reminder was actually sent'
    },
    Status: {
        type: DataTypes.ENUM('pending', 'sent', 'failed'),
        allowNull: false,
        defaultValue: 'pending'
    },
    BrevoMessageId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Message ID from Brevo API response'
    },
    ErrorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Error message if sending failed'
    },
    CancelToken: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'JWT token for secure cancellation link'
    }
}, {
    tableName: 'email_reminders',
    timestamps: true,
    paranoid: true,
    createdAt: 'CreatedAt',
    updatedAt: 'UpdatedAt',
    deletedAt: 'DeletedAt',
    indexes: [
        {
            fields: ['Status', 'ScheduledTime'],
            name: 'idx_email_reminders_status_scheduled'
        },
        {
            fields: ['ReservationID'],
            name: 'idx_email_reminders_reservation'
        },
        {
            fields: ['UserID'],
            name: 'idx_email_reminders_user'
        },
        {
            fields: ['ClassID'],
            name: 'idx_email_reminders_class'
        },
        {
            fields: ['RoomReservationID'],
            name: 'idx_email_reminders_room_reservation_id'
        },
        {
            fields: ['Status'],
            name: 'idx_email_reminders_status'
        },
        {
            fields: ['ScheduledTime'],
            name: 'idx_email_reminders_scheduled_time'
        }
    ]
});

module.exports = EmailReminders;
