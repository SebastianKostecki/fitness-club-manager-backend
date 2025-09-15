'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('email_reminders', {
      EmailReminderID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      ReservationID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'reservations',
          key: 'ReservationID'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      UserID: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'UserID'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      ClassID: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'fitness_classes',
          key: 'ClassID'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      UpdatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      },
      DeletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Add indexes for performance
    await queryInterface.addIndex('email_reminders', ['Status', 'ScheduledTime'], {
      name: 'idx_email_reminders_status_scheduled'
    });
    
    await queryInterface.addIndex('email_reminders', ['ReservationID'], {
      name: 'idx_email_reminders_reservation'
    });
    
    await queryInterface.addIndex('email_reminders', ['UserID'], {
      name: 'idx_email_reminders_user'
    });
    
    await queryInterface.addIndex('email_reminders', ['ClassID'], {
      name: 'idx_email_reminders_class'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('email_reminders');
  }
};
