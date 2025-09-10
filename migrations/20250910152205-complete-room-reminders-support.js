'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔧 Completing room reminders support in email_reminders...');
    
    try {
      const table = await queryInterface.describeTable('email_reminders');
      
      // 1. Make ReservationID and ClassID nullable if they aren't already
      if (table.ReservationID && table.ReservationID.allowNull === false) {
        console.log('🔄 Making ReservationID nullable...');
        await queryInterface.changeColumn('email_reminders', 'ReservationID', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'reservations',
            key: 'ReservationID'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        });
      }

      if (table.ClassID && table.ClassID.allowNull === false) {
        console.log('🔄 Making ClassID nullable...');
        await queryInterface.changeColumn('email_reminders', 'ClassID', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'fitness_classes',
            key: 'ClassID'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        });
      }

      // 2. Add RoomReservationID column if it doesn't exist
      if (!table.RoomReservationID) {
        console.log('➕ Adding RoomReservationID column...');
        await queryInterface.addColumn('email_reminders', 'RoomReservationID', {
          type: Sequelize.BIGINT,
          allowNull: true,
          references: {
            model: 'room_reservations',
            key: 'RoomReservationID'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        });
      }

      // 3. Add indexes if they don't exist
      try {
        console.log('📊 Adding index on RoomReservationID...');
        await queryInterface.addIndex('email_reminders', ['RoomReservationID'], {
          name: 'idx_email_reminders_room_reservation_id'
        });
      } catch (e) {
        if (!e.message.includes('already exists')) {
          console.log('⚠️ Index on RoomReservationID may already exist:', e.message);
        }
      }

      try {
        console.log('📊 Adding index on Status...');
        await queryInterface.addIndex('email_reminders', ['Status'], {
          name: 'idx_email_reminders_status'
        });
      } catch (e) {
        if (!e.message.includes('already exists')) {
          console.log('⚠️ Index on Status may already exist:', e.message);
        }
      }

      try {
        console.log('📊 Adding index on ScheduledTime...');
        await queryInterface.addIndex('email_reminders', ['ScheduledTime'], {
          name: 'idx_email_reminders_scheduled_time'
        });
      } catch (e) {
        if (!e.message.includes('already exists')) {
          console.log('⚠️ Index on ScheduledTime may already exist:', e.message);
        }
      }

      // 4. Remove any problematic CHECK constraints
      const [constraints] = await queryInterface.sequelize.query(`
        SELECT CONSTRAINT_NAME 
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'email_reminders' 
        AND CONSTRAINT_TYPE = 'CHECK'
      `);

      for (const constraint of constraints) {
        try {
          console.log(`🗑️ Removing check constraint: ${constraint.CONSTRAINT_NAME}`);
          await queryInterface.removeConstraint('email_reminders', constraint.CONSTRAINT_NAME);
        } catch (e) {
          console.log(`⚠️ Could not remove constraint ${constraint.CONSTRAINT_NAME}: ${e.message}`);
        }
      }

      console.log('✅ Room reminders support completed successfully!');

    } catch (error) {
      console.error('❌ Error in migration:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Rolling back room reminders support...');
    
    try {
      // Remove indexes
      const indexesToRemove = [
        'idx_email_reminders_room_reservation_id',
        'idx_email_reminders_status', 
        'idx_email_reminders_scheduled_time'
      ];

      for (const indexName of indexesToRemove) {
        try {
          await queryInterface.removeIndex('email_reminders', indexName);
          console.log(`✅ Removed index: ${indexName}`);
        } catch (e) {
          console.log(`⚠️ Could not remove index ${indexName}: ${e.message}`);
        }
      }

      // Remove RoomReservationID column
      const table = await queryInterface.describeTable('email_reminders');
      if (table.RoomReservationID) {
        console.log('➖ Removing RoomReservationID column...');
        await queryInterface.removeColumn('email_reminders', 'RoomReservationID');
      }

      // Revert ReservationID and ClassID to NOT NULL (only if safe)
      const [nullReservations] = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as count FROM email_reminders WHERE ReservationID IS NULL
      `);

      if (nullReservations[0].count === 0) {
        console.log('🔄 Reverting ReservationID to NOT NULL...');
        await queryInterface.changeColumn('email_reminders', 'ReservationID', {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'reservations',
            key: 'ReservationID'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        });
      }

      const [nullClasses] = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as count FROM email_reminders WHERE ClassID IS NULL
      `);

      if (nullClasses[0].count === 0) {
        console.log('🔄 Reverting ClassID to NOT NULL...');
        await queryInterface.changeColumn('email_reminders', 'ClassID', {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'fitness_classes',
            key: 'ClassID'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        });
      }

      console.log('✅ Room reminders support rollback completed!');

    } catch (error) {
      console.error('❌ Error in rollback:', error);
      throw error;
    }
  }
};