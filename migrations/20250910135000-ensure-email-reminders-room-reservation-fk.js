'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔧 Ensuring email_reminders has proper room reservation support...');

    // Helper function to check if column exists
    const columnExists = async (tableName, columnName) => {
      const [results] = await queryInterface.sequelize.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = '${tableName}' 
        AND COLUMN_NAME = '${columnName}'
      `);
      return results.length > 0;
    };

    // Helper function to check if constraint exists
    const constraintExists = async (tableName, constraintName) => {
      const [results] = await queryInterface.sequelize.query(`
        SELECT CONSTRAINT_NAME 
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = '${tableName}' 
        AND CONSTRAINT_NAME = '${constraintName}'
      `);
      return results.length > 0;
    };

    // Helper function to check if index exists
    const indexExists = async (tableName, indexName) => {
      const [results] = await queryInterface.sequelize.query(`
        SELECT INDEX_NAME 
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = '${tableName}' 
        AND INDEX_NAME = '${indexName}'
      `);
      return results.length > 0;
    };

    try {
      // 1. Add RoomReservationID column if it doesn't exist
      if (!(await columnExists('email_reminders', 'RoomReservationID'))) {
        console.log('➕ Adding RoomReservationID column...');
        await queryInterface.addColumn('email_reminders', 'RoomReservationID', {
          type: Sequelize.BIGINT,
          allowNull: true,
          comment: 'FK to room_reservations table (for room reservation reminders)'
        });
      } else {
        console.log('✅ RoomReservationID column already exists');
      }

      // 2. Make ClassID optional if it isn't already
      const [classIdInfo] = await queryInterface.sequelize.query(`
        SELECT IS_NULLABLE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'email_reminders' 
        AND COLUMN_NAME = 'ClassID'
      `);
      
      if (classIdInfo.length > 0 && classIdInfo[0].IS_NULLABLE === 'NO') {
        console.log('🔄 Making ClassID optional...');
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
      } else {
        console.log('✅ ClassID is already optional');
      }

      // 3. Add foreign key constraint if it doesn't exist
      if (!(await constraintExists('email_reminders', 'fk_email_reminders_room_reservation'))) {
        console.log('🔗 Adding foreign key constraint...');
        await queryInterface.addConstraint('email_reminders', {
          fields: ['RoomReservationID'],
          type: 'foreign key',
          name: 'fk_email_reminders_room_reservation',
          references: {
            table: 'room_reservations',
            field: 'RoomReservationID'
          },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE'
        });
      } else {
        console.log('✅ Foreign key constraint already exists');
      }

      // 4. Add index if it doesn't exist
      if (!(await indexExists('email_reminders', 'idx_email_reminders_room_reservation'))) {
        console.log('📊 Adding index...');
        await queryInterface.addIndex('email_reminders', ['RoomReservationID'], {
          name: 'idx_email_reminders_room_reservation'
        });
      } else {
        console.log('✅ Index already exists');
      }

      // 5. Remove any problematic check constraints (defensive)
      const [checkConstraints] = await queryInterface.sequelize.query(`
        SELECT CONSTRAINT_NAME 
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'email_reminders' 
        AND CONSTRAINT_TYPE = 'CHECK'
        AND CONSTRAINT_NAME LIKE 'chk_email_reminders_%'
      `);

      for (const constraint of checkConstraints) {
        try {
          console.log(`🗑️ Removing problematic check constraint: ${constraint.CONSTRAINT_NAME}`);
          await queryInterface.removeConstraint('email_reminders', constraint.CONSTRAINT_NAME);
        } catch (error) {
          console.log(`⚠️ Could not remove check constraint ${constraint.CONSTRAINT_NAME}: ${error.message}`);
        }
      }

      console.log('✅ Email reminders room reservation support ensured successfully!');

    } catch (error) {
      console.error('❌ Error ensuring email reminders schema:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Reverting email_reminders room reservation support...');

    // Helper functions (same as above)
    const constraintExists = async (tableName, constraintName) => {
      const [results] = await queryInterface.sequelize.query(`
        SELECT CONSTRAINT_NAME 
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = '${tableName}' 
        AND CONSTRAINT_NAME = '${constraintName}'
      `);
      return results.length > 0;
    };

    const indexExists = async (tableName, indexName) => {
      const [results] = await queryInterface.sequelize.query(`
        SELECT INDEX_NAME 
        FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = '${tableName}' 
        AND INDEX_NAME = '${indexName}'
      `);
      return results.length > 0;
    };

    const columnExists = async (tableName, columnName) => {
      const [results] = await queryInterface.sequelize.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = '${tableName}' 
        AND COLUMN_NAME = '${columnName}'
      `);
      return results.length > 0;
    };

    try {
      // Remove foreign key constraint
      if (await constraintExists('email_reminders', 'fk_email_reminders_room_reservation')) {
        console.log('🔗 Removing foreign key constraint...');
        await queryInterface.removeConstraint('email_reminders', 'fk_email_reminders_room_reservation');
      }

      // Remove index
      if (await indexExists('email_reminders', 'idx_email_reminders_room_reservation')) {
        console.log('📊 Removing index...');
        await queryInterface.removeIndex('email_reminders', 'idx_email_reminders_room_reservation');
      }

      // Remove column
      if (await columnExists('email_reminders', 'RoomReservationID')) {
        console.log('➖ Removing RoomReservationID column...');
        await queryInterface.removeColumn('email_reminders', 'RoomReservationID');
      }

      // Revert ClassID to NOT NULL (if safe to do so)
      const [classIdData] = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as count 
        FROM email_reminders 
        WHERE ClassID IS NULL
      `);

      if (classIdData[0].count === 0) {
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

      console.log('✅ Email reminders room reservation support reverted successfully!');

    } catch (error) {
      console.error('❌ Error reverting email reminders schema:', error);
      throw error;
    }
  }
};
