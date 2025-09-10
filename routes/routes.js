const express = require("express");

const users = require("../controllers/Users.js");
const auth = require("../controllers/Auth.js");
const verify = require("./verifyToken");
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

const router = express.Router();

//Users
router.get("/users", verify, users.getUsers);
router.get("/users/:id", verify, users.getUserById);
router.post("/users", verify, users.createUser);
router.put("/users/:id", verify, users.updateUser);
router.delete("/users/:id", verify, users.deleteUser);

//Rooms
router.get("/rooms", verify, rooms.getRooms);
router.get("/rooms/:id", verify, rooms.getRoombyId);
router.post("/rooms", verify, adminOrReceptionist, rooms.createRoom);
router.put("/rooms/:id", verify, adminOrReceptionist, rooms.updateRoom);
router.delete("/rooms/:id", verify, adminOrReceptionist, rooms.deleteRoom);

//Equipment
router.get("/equipment",verify, equipment.getEquipment);
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
router.get("/classes/:id", verify, fitnessClasses.getFitnessClassById);
router.post("/classes", verify, adminOrTrainer, fitnessClasses.createFitnessClass);
router.put("/classes/:id", verify, adminOrTrainer, fitnessClasses.updateFitnessClass);
router.delete("/classes/:id", verify, adminOrTrainer, fitnessClasses.deleteFitnessClass);

//Reservations
router.get("/reservations", verify, reservations.getReservations);
router.get("/reservations/:id", verify, reservations.getReservationById);
router.post("/reservations", verify, ensureRole(['regular', 'admin', 'receptionist']), reservations.createReservation);
router.put("/reservations/:id", verify, canManageReservation, reservations.updateReservation);
router.delete("/reservations/:id", verify, canManageReservation, reservations.deleteReservation);


//Auth
router.post("/register", auth.registerUser);
router.post("/login", auth.loginUser);

//Calendar
router.use("/calendar", calendarRoutes);

//Jobs and reminders
router.use("/jobs", jobRoutes);

module.exports = router;
