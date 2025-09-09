'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Update Role column to allow 'receptionist' value
    // Since we're using VARCHAR, we just need to ensure the column can hold the new value
    // The validation will be handled in the application layer
    
    console.log('Migration: Adding receptionist role support');
    console.log('Note: Role validation is handled in application layer');
    
    // Optional: Add a comment to document available roles
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      COMMENT = 'Available roles: regular, trainer, admin, receptionist'
    `);
  },

  async down (queryInterface, Sequelize) {
    // Revert any receptionist users back to regular
    await queryInterface.sequelize.query(`
      UPDATE users 
      SET Role = 'regular' 
      WHERE Role = 'receptionist'
    `);
    
    // Remove comment
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      COMMENT = ''
    `);
  }
};
