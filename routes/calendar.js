const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const verifyToken = require('../middleware/verifyToken');

// Apply authentication middleware to all calendar routes
router.use(verifyToken);

// Calendar routes
router.get('/user', calendarController.getUserCalendar);
router.get('/trainer', calendarController.getTrainerCalendar);
router.get('/rooms/availability', calendarController.getRoomAvailability);
router.get('/rooms/:roomId', calendarController.getRoomAvailability); // Legacy support

// Room reservation routes
router.post('/rooms/:roomId/reservations', calendarController.createRoomReservation);
router.delete('/room-reservations/:id', calendarController.cancelRoomReservation);

// Fitness class routes
router.post('/classes', calendarController.createFitnessClass);
router.delete('/reservations/:id', calendarController.cancelClassReservation);

module.exports = router;
