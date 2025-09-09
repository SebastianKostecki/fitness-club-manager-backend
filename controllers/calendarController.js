const calendarService = require('../services/calendarService');

/**
 * Get user's calendar events
 * GET /calendar/user?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
const getUserCalendar = async (req, res) => {
    try {
        const { from, to } = req.query;
        const userId = req.user.id;
        const userRole = req.headers["auth-role"] || 'regular';

        if (!from || !to) {
            return res.status(400).json({ 
                error: 'Missing required query parameters: from, to' 
            });
        }

        // Validate date format
        const startDate = new Date(from);
        const endDate = new Date(to);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({ 
                error: 'Invalid date format. Use YYYY-MM-DD' 
            });
        }

        if (startDate >= endDate) {
            return res.status(400).json({ 
                error: 'Start date must be before end date' 
            });
        }

        const calendar = await calendarService.getUserCalendar(
            userId, 
            startDate, 
            endDate, 
            userRole
        );

        res.json(calendar);

    } catch (error) {
        console.error('Error fetching user calendar:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
};

/**
 * Get trainer's calendar events
 * GET /calendar/trainer?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
const getTrainerCalendar = async (req, res) => {
    try {
        const { from, to } = req.query;
        const userId = req.user.id;
        const userRole = req.headers["auth-role"];

        if (userRole !== 'trainer' && userRole !== 'admin') {
            return res.status(403).json({ 
                error: 'Access denied. Trainer role required.' 
            });
        }

        if (!from || !to) {
            return res.status(400).json({ 
                error: 'Missing required query parameters: from, to' 
            });
        }

        const startDate = new Date(from);
        const endDate = new Date(to);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({ 
                error: 'Invalid date format. Use YYYY-MM-DD' 
            });
        }

        const calendar = await calendarService.getUserCalendar(
            userId, 
            startDate, 
            endDate, 
            'trainer'
        );

        res.json(calendar);

    } catch (error) {
        console.error('Error fetching trainer calendar:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
};

/**
 * Get room availability
 * GET /calendar/rooms/:roomId?date=YYYY-MM-DD
 */
const getRoomAvailability = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { date } = req.query;

        if (!roomId || !date) {
            return res.status(400).json({ 
                error: 'Missing required parameters: roomId, date' 
            });
        }

        const checkDate = new Date(date);
        if (isNaN(checkDate.getTime())) {
            return res.status(400).json({ 
                error: 'Invalid date format. Use YYYY-MM-DD' 
            });
        }

        const availability = await calendarService.getRoomAvailability(
            parseInt(roomId), 
            checkDate
        );

        res.json(availability);

    } catch (error) {
        console.error('Error fetching room availability:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
};

/**
 * Create room reservation
 * POST /rooms/:roomId/reservations
 */
const createRoomReservation = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { startTime, endTime, title } = req.body;
        const userId = req.user.id;

        if (!startTime || !endTime) {
            return res.status(400).json({ 
                error: 'Missing required fields: startTime, endTime' 
            });
        }

        const reservation = await calendarService.reserveRoom({
            roomId: parseInt(roomId),
            userId: userId,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            title: title || 'Rezerwacja sali'
        });

        res.status(201).json({
            message: 'Room reserved successfully',
            reservation
        });

    } catch (error) {
        console.error('Error creating room reservation:', error);
        
        // Handle specific conflict errors
        if (error.message.includes('already reserved') || 
            error.message.includes('occupied')) {
            return res.status(409).json({ 
                error: 'Conflict',
                message: error.message 
            });
        }

        if (error.message.includes('not found') || 
            error.message.includes('Missing required')) {
            return res.status(400).json({ 
                error: 'Bad request',
                message: error.message 
            });
        }

        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
};

/**
 * Create fitness class
 * POST /classes
 */
const createFitnessClass = async (req, res) => {
    try {
        const { roomId, startTime, endTime, title, capacity } = req.body;
        const trainerId = req.user.id;
        const userRole = req.headers["auth-role"];

        if (userRole !== 'trainer' && userRole !== 'admin') {
            return res.status(403).json({ 
                error: 'Access denied. Trainer role required.' 
            });
        }

        if (!roomId || !startTime || !endTime || !title || !capacity) {
            return res.status(400).json({ 
                error: 'Missing required fields: roomId, startTime, endTime, title, capacity' 
            });
        }

        const fitnessClass = await calendarService.createClass({
            trainerId: trainerId,
            roomId: parseInt(roomId),
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            title,
            capacity: parseInt(capacity)
        });

        res.status(201).json({
            message: 'Fitness class created successfully',
            class: fitnessClass
        });

    } catch (error) {
        console.error('Error creating fitness class:', error);
        
        // Handle specific conflict errors
        if (error.message.includes('already scheduled') || 
            error.message.includes('occupied') ||
            error.message.includes('reserved')) {
            return res.status(409).json({ 
                error: 'Conflict',
                message: error.message 
            });
        }

        if (error.message.includes('not found') || 
            error.message.includes('Invalid') ||
            error.message.includes('Missing required') ||
            error.message.includes('exceeds')) {
            return res.status(400).json({ 
                error: 'Bad request',
                message: error.message 
            });
        }

        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
};

/**
 * Cancel room reservation
 * DELETE /room-reservations/:id
 */
const cancelRoomReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.headers["auth-role"];

        const { RoomReservations } = require('../models');
        
        const reservation = await RoomReservations.findByPk(id);
        
        if (!reservation) {
            return res.status(404).json({ 
                error: 'Room reservation not found' 
            });
        }

        // Check if user owns the reservation or is admin
        if (reservation.CreatedByUserID !== userId && userRole !== 'admin') {
            return res.status(403).json({ 
                error: 'Access denied. You can only cancel your own reservations.' 
            });
        }

        // Soft delete (set status to Cancelled)
        await reservation.update({ Status: 'Cancelled' });

        res.json({
            message: 'Room reservation cancelled successfully'
        });

    } catch (error) {
        console.error('Error cancelling room reservation:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
};

/**
 * Cancel class reservation
 * DELETE /reservations/:id
 */
const cancelClassReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.headers["auth-role"];

        const { Reservations } = require('../models');
        
        const reservation = await Reservations.findByPk(id);
        
        if (!reservation) {
            return res.status(404).json({ 
                error: 'Class reservation not found' 
            });
        }

        // Check if user owns the reservation or is admin
        if (reservation.UserID !== userId && userRole !== 'admin') {
            return res.status(403).json({ 
                error: 'Access denied. You can only cancel your own reservations.' 
            });
        }

        // Update status to cancelled
        await reservation.update({ Status: 'cancelled' });

        res.json({
            message: 'Class reservation cancelled successfully'
        });

    } catch (error) {
        console.error('Error cancelling class reservation:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
};

module.exports = {
    getUserCalendar,
    getTrainerCalendar,
    getRoomAvailability,
    createRoomReservation,
    createFitnessClass,
    cancelRoomReservation,
    cancelClassReservation
};
