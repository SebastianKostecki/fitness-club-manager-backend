'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove existing foreign key constraints that will conflict
    try {
      await queryInterface.removeConstraint('room_equipment', 'fk_room_equipment_room');
    } catch (e) {
      console.log('Foreign key fk_room_equipment_room does not exist, skipping...');
    }
    
    try {
      await queryInterface.removeConstraint('room_equipment', 'fk_room_equipment_equipment');
    } catch (e) {
      console.log('Foreign key fk_room_equipment_equipment does not exist, skipping...');
    }

    // Change PRIMARY KEYS to BIGINT for consistency
    // For MySQL, we need to use raw SQL to modify AUTO_INCREMENT PRIMARY KEY columns
    
    // 1. Change users.UserID from INT to BIGINT
    await queryInterface.sequelize.query('ALTER TABLE users MODIFY UserID BIGINT NOT NULL AUTO_INCREMENT');

    // 2. Change rooms.RoomID from INT to BIGINT
    await queryInterface.sequelize.query('ALTER TABLE rooms MODIFY RoomID BIGINT NOT NULL AUTO_INCREMENT');

    // Now foreign keys should match - change them back to BIGINT if needed
    // 3. Change fitness_classes.TrainerID to BIGINT (already done, but ensure)
    await queryInterface.changeColumn('fitness_classes', 'TrainerID', {
      type: Sequelize.BIGINT,
      allowNull: true
    });

    // 4. Change fitness_classes.RoomID to BIGINT (already done, but ensure)  
    await queryInterface.changeColumn('fitness_classes', 'RoomID', {
      type: Sequelize.BIGINT,
      allowNull: true
    });

    // 5. Change reservations.UserID to BIGINT (already done, but ensure)
    await queryInterface.changeColumn('reservations', 'UserID', {
      type: Sequelize.BIGINT,
      allowNull: false
    });

    // 6. Change room_equipment.RoomID to BIGINT
    await queryInterface.changeColumn('room_equipment', 'RoomID', {
      type: Sequelize.BIGINT,
      allowNull: false
    });

    // 5. Change room_equipment.EquipmentID to match equipment.EquipmentID (INTEGER)
    // This should already be INTEGER, but let's ensure consistency

    // 6. Update fitness_classes StartTime/EndTime to NOT NULL (safely)
    // First, update any NULL values to a default
    await queryInterface.sequelize.query(`
      UPDATE fitness_classes 
      SET StartTime = '2024-01-01 09:00:00' 
      WHERE StartTime IS NULL
    `);
    
    await queryInterface.sequelize.query(`
      UPDATE fitness_classes 
      SET EndTime = '2024-01-01 10:00:00' 
      WHERE EndTime IS NULL
    `);

    // Then change to NOT NULL
    await queryInterface.changeColumn('fitness_classes', 'StartTime', {
      type: Sequelize.DATE,
      allowNull: false
    });

    await queryInterface.changeColumn('fitness_classes', 'EndTime', {
      type: Sequelize.DATE,
      allowNull: false
    });

    // 7. Make Title NOT NULL in fitness_classes
    await queryInterface.sequelize.query(`
      UPDATE fitness_classes 
      SET Title = 'Zajęcia fitness' 
      WHERE Title IS NULL
    `);

    await queryInterface.changeColumn('fitness_classes', 'Title', {
      type: Sequelize.STRING(100),
      allowNull: false
    });

    // 8. Make Capacity NOT NULL in fitness_classes
    await queryInterface.sequelize.query(`
      UPDATE fitness_classes 
      SET Capacity = 20 
      WHERE Capacity IS NULL
    `);

    await queryInterface.changeColumn('fitness_classes', 'Capacity', {
      type: Sequelize.INTEGER,
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert changes (be careful with data loss)
    await queryInterface.changeColumn('fitness_classes', 'TrainerID', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    await queryInterface.changeColumn('fitness_classes', 'RoomID', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    await queryInterface.changeColumn('reservations', 'UserID', {
      type: Sequelize.INTEGER,
      allowNull: false
    });

    await queryInterface.changeColumn('room_equipment', 'RoomID', {
      type: Sequelize.INTEGER,
      allowNull: false
    });

    // Revert NOT NULL constraints
    await queryInterface.changeColumn('fitness_classes', 'StartTime', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.changeColumn('fitness_classes', 'EndTime', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.changeColumn('fitness_classes', 'Title', {
      type: Sequelize.STRING(100),
      allowNull: true
    });

    await queryInterface.changeColumn('fitness_classes', 'Capacity', {
      type: Sequelize.INTEGER,
      allowNull: true
    });
  }
};
