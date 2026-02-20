
const express = require("express");

const users = require("../controllers/Users.js");
const auth = require("../controllers/Auth.js");
const verify = require("../middleware/verifyToken");
const rooms=require("../controllers/Rooms.js");
const equipment=require("../controllers/Equipment.js");
const roomEquipment=require("../controllers/RoomEquipment.js");
const fitnessClasses=require("../controllers/FitnessClasses.js");
const reservations = require("../controllers/Reservations.js");
const calendarRoutes = require("./calendar.js");
const jobRoutes = require("./jobs.js");
const { 
    isAdmin, 
    isReceptionist, 
    adminOrReceptionist, 
    adminOrTrainer, 
    ensureRole,
    canManageReservation 
} = require("../middleware/roleCheck");
const { 
    validateUserExists,
    validateClassExists,
    validateRoomExists,
    validateReservationExists,
    validateReservationReferences,
    validateRoomReservationReferences
} = require("../middleware/validateReferences");

const router = express.Router();

//Users
router.get("/users", verify, users.getUsers);
router.get("/users/me", verify, users.getCurrentUser);
router.get("/users/metrics", verify, users.getSystemMetrics);
router.get("/users/:id", verify, validateUserExists, users.getUserById);
router.post("/users", verify, adminOrReceptionist, users.createUser);
router.put("/users/:id", verify, adminOrReceptionist, validateUserExists, users.updateUser);
router.put("/users/:id/role", verify, isAdmin, validateUserExists, users.updateUserRole);
router.delete("/users/:id", verify, adminOrReceptionist, validateUserExists, users.deleteUser);

//Rooms
router.get("/rooms", verify, rooms.getRooms);
router.get("/rooms/:id", verify, validateRoomExists, rooms.getRoombyId);
router.get("/rooms/:id/calendar", verify, validateRoomExists, rooms.getRoomCalendar);
router.post("/rooms", verify, adminOrReceptionist, rooms.createRoom);
router.put("/rooms/:id", verify, adminOrReceptionist, validateRoomExists, rooms.updateRoom);
router.delete("/rooms/:id", verify, adminOrReceptionist, validateRoomExists, rooms.deleteRoom);

//Equipment
router.get("/equipment",verify, equipment.getEquipment);
// TEMP: Equipment without auth for debugging
router.get("/equipment-test", equipment.getEquipment);
// TEMP: Manual equipment table sync
router.get("/equipment-sync", async (req, res) => {
  try {
    const { Equipment } = require('../models');
    console.log('🔧 Manual equipment sync started...');
    await Equipment.sync({ alter: true });
    console.log('✅ Equipment table synced successfully');
    res.json({ success: true, message: 'Equipment table synced successfully' });
  } catch (error) {
    console.error('❌ Equipment sync error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// TEMP: Load initial equipment data
router.get("/equipment-load-data", async (req, res) => {
  try {
    const { Equipment } = require('../models');
    
    // Check if data already exists
    const existingCount = await Equipment.count();
    if (existingCount > 0) {
      return res.json({ 
        success: false, 
        message: `Equipment table already has ${existingCount} records. Skipping data load.` 
      });
    }
    
    console.log('📊 Loading initial equipment data...');
    
    const equipmentData = [
      { EquipmentName: 'Ketle', Description: '15 kg' },
      { EquipmentName: 'Mata', Description: '180 cm x 60 cm' },
      { EquipmentName: 'Roller', Description: '30 x 15 cm' },
      { EquipmentName: 'Ketle', Description: '5 kg' }
    ];
    
    for (const item of equipmentData) {
      await Equipment.create(item);
      console.log(`✅ Created: ${item.EquipmentName} - ${item.Description}`);
    }
    
    console.log('🎉 Equipment data loaded successfully');
    res.json({ 
      success: true, 
      message: `Successfully loaded ${equipmentData.length} equipment records`,
      data: equipmentData 
    });
  } catch (error) {
    console.error('❌ Equipment data load error:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
router.get("/equipment/:id", verify, equipment.getEquipmentById);
router.post("/equipment", verify, adminOrReceptionist, equipment.createEquipment);
router.put("/equipment/:id", verify, adminOrReceptionist, equipment.updateEquipment);
router.delete("/equipment/:id", verify, adminOrReceptionist, equipment.deleteEquipment);

//RoomEquipment
router.get("/room-equipment", verify, roomEquipment.getRoomEquipment);
router.post("/room-equipment", verify, adminOrReceptionist, roomEquipment.createRoomEquipment);
router.get("/rooms/:id/details", verify, rooms.getRoomDetails);
router.put("/room-equipment/:roomId/:equipmentId", verify, adminOrReceptionist, roomEquipment.updateRoomEquipment);
router.delete("/room-equipment/:roomId/:equipmentId", verify, adminOrReceptionist, roomEquipment.deleteRoomEquipment);

// Fitness Classes
router.get("/classes", verify, fitnessClasses.getFitnessClasses);
router.get("/classes/:id", verify, validateClassExists, fitnessClasses.getFitnessClassById);
router.post("/classes", verify, adminOrTrainer, fitnessClasses.createFitnessClass);
router.put("/classes/:id", verify, adminOrTrainer, validateClassExists, fitnessClasses.updateFitnessClass);
router.delete("/classes/:id", verify, adminOrTrainer, validateClassExists, fitnessClasses.deleteFitnessClass);

//Reservations
router.get("/reservations/raw", verify, reservations.getRawReservations);
router.get("/reservations/all", verify, reservations.getAllReservations);
router.get("/reservations", verify, reservations.getReservations);
router.get("/reservations/:id", verify, validateReservationExists, reservations.getReservationById);
router.post("/reservations", verify, ensureRole(['regular', 'admin', 'receptionist']), validateReservationReferences, reservations.createReservation);
router.put("/reservations/:id", verify, canManageReservation, validateReservationExists, validateReservationReferences, reservations.updateReservation);
router.delete("/reservations/:id", verify, canManageReservation, validateReservationExists, reservations.deleteReservation);


//Auth
router.post("/register", auth.registerUser);
router.post("/login", auth.loginUser);
router.post("/logout", auth.logoutUser);

//Calendar
router.use("/calendar", calendarRoutes);

//Jobs and reminders
router.use("/jobs", jobRoutes);

module.exports = router;
