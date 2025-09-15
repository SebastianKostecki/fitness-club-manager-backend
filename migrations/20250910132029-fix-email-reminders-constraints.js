'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔧 Fixing email_reminders constraints...');

    try {
      // 1. Remove duplicate and problematic foreign key constraints
      const [constraints] = await queryInterface.sequelize.query(`
        SELECT CONSTRAINT_NAME 
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'email_reminders' 
        AND CONSTRAINT_TYPE = 'FOREIGN KEY'
      `);

      console.log('Found constraints:', constraints.map(c => c.CONSTRAINT_NAME));

      // Remove all FK constraints except the main ones we want to keep
      const constraintsToRemove = [
        'email_reminders_ibfk_3', // Duplicate ClassID FK
        'email_reminders_ibfk_4', // Duplicate ClassID FK  
        'email_reminders_ibfk_5', // Duplicate ClassID FK
        'email_reminders_RoomReservationID_foreign_idx' // Wrong ON DELETE CASCADE
      ];

      for (const constraintName of constraintsToRemove) {
        try {
          await queryInterface.removeConstraint('email_reminders', constraintName);
          console.log(`✅ Removed constraint: ${constraintName}`);
        } catch (error) {
          console.log(`⚠️ Could not remove constraint ${constraintName}: ${error.message}`);
        }
      }

      // 2. Make ClassID nullable
      console.log('🔄 Making ClassID optional...');
      await queryInterface.changeColumn('email_reminders', 'ClassID', {
        type: Sequelize.INTEGER,
        allowNull: true, // Make it optional
        references: {
          model: 'fitness_classes',
          key: 'ClassID'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      // 3. Ensure we have the correct FK constraint for RoomReservationID (with SET NULL)
      const [roomFKs] = await queryInterface.sequelize.query(`
        SELECT CONSTRAINT_NAME 
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'email_reminders' 
        AND CONSTRAINT_TYPE = 'FOREIGN KEY'
        AND CONSTRAINT_NAME = 'fk_email_reminders_room_reservation'
      `);

      if (roomFKs.length === 0) {
        console.log('🔗 Adding correct RoomReservationID FK constraint...');
        await queryInterface.addConstraint('email_reminders', {
          fields: ['RoomReservationID'],
          type: 'foreign key',
          name: 'fk_email_reminders_room_reservation',
          references: {
            table: 'room_reservations',
            field: 'RoomReservationID'
          },
          onDelete: 'SET NULL', // Correct behavior
          onUpdate: 'CASCADE'
        });
      }

      console.log('✅ Email reminders constraints fixed successfully!');

    } catch (error) {
      console.error('❌ Error fixing constraints:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Reverting email_reminders constraint fixes...');
    
    // This is a cleanup migration, so down should be minimal
    // Just revert ClassID to NOT NULL if safe
    try {
      const [nullClassIds] = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as count 
        FROM email_reminders 
        WHERE ClassID IS NULL
      `);

      if (nullClassIds[0].count === 0) {
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
      } else {
        console.log('⚠️ Cannot revert ClassID to NOT NULL - there are NULL values');
      }

      console.log('✅ Constraint fixes reverted successfully!');
    } catch (error) {
      console.error('❌ Error reverting constraint fixes:', error);
      throw error;
    }
  }
};