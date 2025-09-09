'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add Foreign Key Constraints
    
    // fitness_classes.TrainerID -> users.UserID
    await queryInterface.addConstraint('fitness_classes', {
      fields: ['TrainerID'],
      type: 'foreign key',
      name: 'fk_fitness_classes_trainer',
      references: {
        table: 'users',
        field: 'UserID'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    // fitness_classes.RoomID -> rooms.RoomID
    await queryInterface.addConstraint('fitness_classes', {
      fields: ['RoomID'],
      type: 'foreign key',
      name: 'fk_fitness_classes_room',
      references: {
        table: 'rooms',
        field: 'RoomID'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });

    // reservations.UserID -> users.UserID
    await queryInterface.addConstraint('reservations', {
      fields: ['UserID'],
      type: 'foreign key',
      name: 'fk_reservations_user',
      references: {
        table: 'users',
        field: 'UserID'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // reservations.ClassID -> fitness_classes.ClassID
    await queryInterface.addConstraint('reservations', {
      fields: ['ClassID'],
      type: 'foreign key',
      name: 'fk_reservations_class',
      references: {
        table: 'fitness_classes',
        field: 'ClassID'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // room_equipment.RoomID -> rooms.RoomID
    await queryInterface.addConstraint('room_equipment', {
      fields: ['RoomID'],
      type: 'foreign key',
      name: 'fk_room_equipment_room',
      references: {
        table: 'rooms',
        field: 'RoomID'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // room_equipment.EquipmentID -> equipment.EquipmentID
    await queryInterface.addConstraint('room_equipment', {
      fields: ['EquipmentID'],
      type: 'foreign key',
      name: 'fk_room_equipment_equipment',
      references: {
        table: 'equipment',
        field: 'EquipmentID'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });

    // 2. Add Unique Constraints
    
    // reservations: unique (UserID, ClassID) - user can't book same class twice
    await queryInterface.addConstraint('reservations', {
      fields: ['UserID', 'ClassID'],
      type: 'unique',
      name: 'uk_reservations_user_class'
    });

    // room_equipment: unique (RoomID, EquipmentID) - equipment can't be duplicated in room
    await queryInterface.addConstraint('room_equipment', {
      fields: ['RoomID', 'EquipmentID'],
      type: 'unique',
      name: 'uk_room_equipment_room_equipment'
    });

    // 3. Add Indexes for Performance
    
    // fitness_classes indexes
    await queryInterface.addIndex('fitness_classes', ['TrainerID'], {
      name: 'idx_fitness_classes_trainer'
    });
    
    await queryInterface.addIndex('fitness_classes', ['RoomID'], {
      name: 'idx_fitness_classes_room'
    });
    
    await queryInterface.addIndex('fitness_classes', ['StartTime'], {
      name: 'idx_fitness_classes_start_time'
    });
    
    await queryInterface.addIndex('fitness_classes', ['Status'], {
      name: 'idx_fitness_classes_status'
    });
    
    // Composite index for room availability queries
    await queryInterface.addIndex('fitness_classes', ['RoomID', 'StartTime', 'EndTime'], {
      name: 'idx_class_time_room'
    });

    // reservations indexes
    await queryInterface.addIndex('reservations', ['UserID'], {
      name: 'idx_reservations_user'
    });
    
    await queryInterface.addIndex('reservations', ['ClassID'], {
      name: 'idx_reservations_class'
    });
    
    await queryInterface.addIndex('reservations', ['Status'], {
      name: 'idx_reservations_status'
    });
    
    await queryInterface.addIndex('reservations', ['UserID', 'Status'], {
      name: 'idx_reservations_user_status'
    });

    // room_equipment indexes
    await queryInterface.addIndex('room_equipment', ['RoomID', 'EquipmentID'], {
      name: 'idx_room_equipment_composite'
    });

    // users email index (if not exists)
    await queryInterface.addIndex('users', ['Email'], {
      name: 'idx_users_email'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove indexes
    const indexes = [
      'idx_fitness_classes_trainer',
      'idx_fitness_classes_room', 
      'idx_fitness_classes_start_time',
      'idx_fitness_classes_status',
      'idx_class_time_room',
      'idx_reservations_user',
      'idx_reservations_class',
      'idx_reservations_status',
      'idx_reservations_user_status',
      'idx_room_equipment_composite',
      'idx_users_email'
    ];

    for (const index of indexes) {
      try {
        await queryInterface.removeIndex('fitness_classes', index);
      } catch (e) {
        // Index might not exist on this table
      }
      try {
        await queryInterface.removeIndex('reservations', index);
      } catch (e) {
        // Index might not exist on this table
      }
      try {
        await queryInterface.removeIndex('room_equipment', index);
      } catch (e) {
        // Index might not exist on this table
      }
      try {
        await queryInterface.removeIndex('users', index);
      } catch (e) {
        // Index might not exist on this table
      }
    }

    // Remove unique constraints
    await queryInterface.removeConstraint('reservations', 'uk_reservations_user_class');
    await queryInterface.removeConstraint('room_equipment', 'uk_room_equipment_room_equipment');

    // Remove foreign key constraints
    await queryInterface.removeConstraint('fitness_classes', 'fk_fitness_classes_trainer');
    await queryInterface.removeConstraint('fitness_classes', 'fk_fitness_classes_room');
    await queryInterface.removeConstraint('reservations', 'fk_reservations_user');
    await queryInterface.removeConstraint('reservations', 'fk_reservations_class');
    await queryInterface.removeConstraint('room_equipment', 'fk_room_equipment_room');
    await queryInterface.removeConstraint('room_equipment', 'fk_room_equipment_equipment');
  }
};
