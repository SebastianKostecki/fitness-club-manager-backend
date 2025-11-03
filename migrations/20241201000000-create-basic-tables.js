'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create users table
    await queryInterface.createTable('users', {
      UserID: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      Username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      Password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      Email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      Role: {
        type: Sequelize.ENUM('admin', 'receptionist', 'trener', 'regular'),
        allowNull: false,
        defaultValue: 'regular'
      },
      CreatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      UpdatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      },
      DeletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Create rooms table
    await queryInterface.createTable('rooms', {
      RoomID: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      RoomName: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      Capacity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      Location: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      CreatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      UpdatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      },
      DeletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Create fitness_classes table
    await queryInterface.createTable('fitness_classes', {
      ClassID: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      TrainerID: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      RoomID: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      Title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      StartTime: {
        type: Sequelize.DATE,
        allowNull: false
      },
      EndTime: {
        type: Sequelize.DATE,
        allowNull: false
      },
      Capacity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      Status: {
        type: Sequelize.ENUM('scheduled', 'ongoing', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'scheduled'
      },
      CreatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      UpdatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      },
      DeletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Create reservations table
    await queryInterface.createTable('reservations', {
      ReservationID: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      UserID: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      ClassID: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      Status: {
        type: Sequelize.ENUM('pending', 'confirmed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
      },
      CreatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      UpdatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      },
      DeletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Create room_reservations table
    await queryInterface.createTable('room_reservations', {
      RoomReservationID: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      RoomID: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      CreatedByUserID: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      Title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      StartTime: {
        type: Sequelize.DATE,
        allowNull: false
      },
      EndTime: {
        type: Sequelize.DATE,
        allowNull: false
      },
      Status: {
        type: Sequelize.ENUM('Active', 'Cancelled'),
        allowNull: false,
        defaultValue: 'Active'
      },
      CreatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      UpdatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      },
      DeletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Create email_reminders table
    await queryInterface.createTable('email_reminders', {
      EmailReminderID: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      ReservationID: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      UserID: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      ClassID: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      RoomReservationID: {
        type: Sequelize.BIGINT,
        allowNull: true
      },
      ScheduledTime: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'When to send the reminder (1 hour before class)'
      },
      SentAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the reminder was actually sent'
      },
      Status: {
        type: Sequelize.ENUM('pending', 'sent', 'failed'),
        allowNull: false,
        defaultValue: 'pending'
      },
      BrevoMessageId: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Message ID from Brevo API response'
      },
      ErrorMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Error message if sending failed'
      },
      CancelToken: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'JWT token for secure cancellation link'
      },
      CreatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      UpdatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      },
      DeletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('email_reminders');
    await queryInterface.dropTable('room_reservations');
    await queryInterface.dropTable('reservations');
    await queryInterface.dropTable('fitness_classes');
    await queryInterface.dropTable('rooms');
    await queryInterface.dropTable('users');
  }
};
