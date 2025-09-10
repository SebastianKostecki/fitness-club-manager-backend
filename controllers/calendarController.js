const calendarService = require('../services/calendarService');
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const { zonedTimeToUtc } = require('date-fns-tz');

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
 * GET /calendar/rooms/availability?roomId=1&date=2025-09-10
 */
const getRoomAvailability = async (req, res) => {
    try {
        const { roomId, date } = req.query;

        // Validate roomId
        const id = Number(roomId);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'Invalid roomId' });
        }

        // Validate date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
            return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
        }

        // Calculate day range in Europe/Warsaw timezone
        const tz = 'Europe/Warsaw';
        const startLocal = new Date(`${date}T00:00:00`);
        const endLocal = new Date(`${date}T23:59:59.999`);
        const startUtc = zonedTimeToUtc(startLocal, tz);
        const endUtc = zonedTimeToUtc(endLocal, tz);

        console.info('[availability]', { 
            roomId: id, 
            date, 
            startUtc: startUtc.toISOString(), 
            endUtc: endUtc.toISOString() 
        });

        // Query both fitness classes and room reservations with UNION ALL
        const sql = `
            SELECT 'class' AS type,
                   fc.ClassID AS id,
                   fc.Title AS title,
                   fc.StartTime AS start,
                   fc.EndTime AS \`end\`,
                   'fitness_classes' AS source
            FROM fitness_classes fc
            WHERE fc.RoomID = :roomId
              AND fc.Status = 'Active'
              AND fc.StartTime < :end
              AND fc.EndTime > :start
            UNION ALL
            SELECT 'room_reservation' AS type,
                   rr.RoomReservationID AS id,
                   rr.Title AS title,
                   rr.StartTime AS start,
                   rr.EndTime AS \`end\`,
                   'room_reservations' AS source
            FROM room_reservations rr
            WHERE rr.RoomID = :roomId
              AND rr.Status = 'Active'
              AND rr.StartTime < :end
              AND rr.EndTime > :start
            ORDER BY start ASC
        `;

        const events = await sequelize.query(sql, {
            replacements: { roomId: id, start: startUtc, end: endUtc },
            type: QueryTypes.SELECT
        });

        return res.json({ roomId: id, date, events });

    } catch (error) {
        console.error('getRoomAvailability error:', error);
        return res.status(500).json({ error: 'Internal server error' });
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
