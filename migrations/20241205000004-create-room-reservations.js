'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('room_reservations', {
      RoomReservationID: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      RoomID: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'rooms',
          key: 'RoomID'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      CreatedByUserID: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'UserID'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      Title: {
        type: Sequelize.STRING(120),
        allowNull: false,
        defaultValue: 'Rezerwacja sali'
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
        type: Sequelize.ENUM('Active', 'Cancelled', 'Finished'),
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

    // Add indexes for performance
    await queryInterface.addIndex('room_reservations', ['RoomID', 'StartTime', 'EndTime'], {
      name: 'idx_rr_room_time'
    });

    await queryInterface.addIndex('room_reservations', ['CreatedByUserID', 'StartTime'], {
      name: 'idx_rr_user_time'
    });

    await queryInterface.addIndex('room_reservations', ['Status'], {
      name: 'idx_rr_status'
    });

    // Add constraint to ensure EndTime > StartTime
    await queryInterface.addConstraint('room_reservations', {
      fields: ['StartTime', 'EndTime'],
      type: 'check',
      name: 'chk_room_reservations_time_order',
      where: {
        EndTime: {
          [Sequelize.Op.gt]: Sequelize.col('StartTime')
        }
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('room_reservations');
  }
};
