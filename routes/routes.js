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
const { checkRole, checkOwnershipOrRole } = require("../middleware/roleCheck");

const router = express.Router();

//Users - with role-based access control
router.get("/users", verify, users.getUsers); // Role logic inside controller
router.get("/users/:id", verify, checkOwnershipOrRole(['admin', 'receptionist']), users.getUserById);
router.post("/users", verify, checkRole(['admin']), users.createUser);
router.put("/users/:id", verify, checkOwnershipOrRole(['admin', 'receptionist']), users.updateUser);
router.put("/users/:id/role", verify, checkRole(['admin', 'receptionist']), users.updateUserRole);
router.delete("/users/:id", verify, users.deleteUser); // Permission logic inside controller

//Rooms
router.get("/rooms", verify, rooms.getRooms);
router.get("/rooms/:id", verify, rooms.getRoombyId);
router.post("/rooms", verify, rooms.createRoom);
router.put("/rooms/:id", verify, rooms.updateRoom);
router.delete("/rooms/:id", verify, rooms.deleteRoom);

//Equipment
router.get("/equipment",verify, equipment.getEquipment);
router.get("/equipment/:id", verify, equipment.getEquipmentById);
router.post("/equipment", verify, equipment.createEquipment);
router.put("/equipment/:id", verify, equipment.updateEquipment);
router.delete("/equipment/:id", verify, equipment.deleteEquipment);

//RoomEquipment
router.get("/room-equipment", verify, roomEquipment.getRoomEquipment);
router.post("/room-equipment", verify, roomEquipment.createRoomEquipment);
router.get("/rooms/:id/details", verify, rooms.getRoomDetails);
router.put("/room-equipment/:roomId/:equipmentId", verify, roomEquipment.updateRoomEquipment);
router.delete("/room-equipment/:roomId/:equipmentId", verify, roomEquipment.deleteRoomEquipment);

// Fitness Classes
router.get("/classes", verify, fitnessClasses.getFitnessClasses);
router.get("/classes/:id", verify, fitnessClasses.getFitnessClassById);
router.post("/classes", verify, fitnessClasses.createFitnessClass);
router.put("/classes/:id", verify, fitnessClasses.updateFitnessClass);
router.delete("/classes/:id", verify, fitnessClasses.deleteFitnessClass);

//Reservations
router.get("/reservations", verify, reservations.getReservations);
router.get("/reservations/:id", verify, reservations.getReservationById);
router.post("/reservations", verify, reservations.createReservation);
router.put("/reservations/:id", verify, reservations.updateReservation);
router.delete("/reservations/:id", verify, reservations.deleteReservation);


//Auth
router.post("/register", auth.registerUser);
router.post("/login", auth.loginUser);

//Calendar
router.use("/calendar", calendarRoutes);

module.exports = router;
