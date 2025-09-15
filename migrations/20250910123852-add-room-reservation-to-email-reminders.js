'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔧 Adding RoomReservationID to email_reminders (idempotent)...');
    
    try {
      // Sprawdź czy kolumna już istnieje
      const table = await queryInterface.describeTable('email_reminders');
      
      if (!table.RoomReservationID) {
        console.log('➕ Adding RoomReservationID column...');
        await queryInterface.addColumn('email_reminders', 'RoomReservationID', {
          type: Sequelize.BIGINT,
          allowNull: true,
          references: {
            model: 'room_reservations',
            key: 'RoomReservationID'
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        });
        console.log('✅ RoomReservationID column added successfully');
      } else {
        console.log('✅ RoomReservationID column already exists');
      }
    } catch (error) {
      console.error('❌ Error in migration:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Removing RoomReservationID from email_reminders...');
    
    try {
      // Sprawdź czy kolumna istnieje
      const table = await queryInterface.describeTable('email_reminders');
      
      if (table.RoomReservationID) {
        console.log('➖ Removing RoomReservationID column...');
        await queryInterface.removeColumn('email_reminders', 'RoomReservationID');
        console.log('✅ RoomReservationID column removed successfully');
      } else {
        console.log('✅ RoomReservationID column does not exist');
      }
    } catch (error) {
      console.error('❌ Error in rollback:', error);
      throw error;
    }
  }
};