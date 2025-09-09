'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = ['users', 'equipment', 'rooms', 'fitness_classes', 'reservations', 'room_equipment'];
    
    for (const table of tables) {
      // Check if columns exist before adding
      const tableInfo = await queryInterface.describeTable(table);
      
      if (!tableInfo.CreatedAt) {
        await queryInterface.addColumn(table, 'CreatedAt', {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        });
      }
      
      if (!tableInfo.UpdatedAt) {
        await queryInterface.addColumn(table, 'UpdatedAt', {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
        });
      }
      
      if (!tableInfo.DeletedAt) {
        await queryInterface.addColumn(table, 'DeletedAt', {
          type: Sequelize.DATE,
          allowNull: true
        });
      }
    }

    // Update existing records with current timestamp for CreatedAt/UpdatedAt
    for (const table of tables) {
      await queryInterface.sequelize.query(`
        UPDATE ${table} 
        SET CreatedAt = CURRENT_TIMESTAMP, UpdatedAt = CURRENT_TIMESTAMP 
        WHERE CreatedAt IS NULL OR UpdatedAt IS NULL
      `);
    }
  },

  async down(queryInterface, Sequelize) {
    const tables = ['users', 'equipment', 'rooms', 'fitness_classes', 'reservations', 'room_equipment'];
    
    for (const table of tables) {
      const tableInfo = await queryInterface.describeTable(table);
      
      if (tableInfo.DeletedAt) {
        await queryInterface.removeColumn(table, 'DeletedAt');
      }
      
      if (tableInfo.UpdatedAt) {
        await queryInterface.removeColumn(table, 'UpdatedAt');
      }
      
      if (tableInfo.CreatedAt) {
        await queryInterface.removeColumn(table, 'CreatedAt');
      }
    }
  }
};
