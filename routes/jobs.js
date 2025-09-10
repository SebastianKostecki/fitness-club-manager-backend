const express = require('express');
const router = express.Router();
const cronJobs = require('../jobs/cronJobs');
const reminderService = require('../services/reminderService');
const brevoService = require('../services/brevoService');
const calendarService = require('../services/calendarService');
const { Reservations, EmailReminders } = require('../models');

/**
 * Internal endpoint to trigger email reminders processing
 * Protected by CRON_INTERNAL_KEY for security
 */
router.post('/send-reminders', async (req, res) => {
    try {
        // Verify internal key
        const internalKey = req.headers['x-internal-key'] || req.body.key;
        const expectedKey = process.env.X_INTERNAL_KEY;
        
        if (!expectedKey || internalKey !== expectedKey) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid internal key'
            });
        }

        // Process reminders
        const results = await reminderService.processPendingReminders();
        
        res.json({
            success: true,
            message: 'Email reminders processed',
            results: results,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ /jobs/send-reminders error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * Get reminder statistics and cron job status
 */
router.get('/status', async (req, res) => {
    try {
        const stats = await reminderService.getStatistics();
        const cronStatus = cronJobs.getStatus();

        res.json({
            ok: true,
            cronEnabled: process.env.REMINDERS_CRON_ENABLED === 'true',
            now: new Date().toISOString(),
            tz: process.env.TZ || 'Europe/Warsaw',
            data: {
                reminders: stats,
                cron: cronStatus
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ /jobs/status error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * Cancel reservation using secure token from email
 */
router.get('/cancel-reservation', async (req, res) => {
    try {
        const { token } = req.query;
        
        if (!token) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'Cancel token is required'
            });
        }

        // Verify token
        const decoded = reminderService.verifyCancelToken(token);
        if (!decoded) {
            return res.status(401).json({
                error: 'Invalid token',
                message: 'The cancellation link has expired or is invalid'
            });
        }

        // Find reservation
        const reservation = await Reservations.findOne({
            where: {
                ReservationID: decoded.reservationId,
                UserID: decoded.userId
            }
        });

        if (!reservation) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Reservation not found or access denied'
            });
        }

        // Check if already cancelled
        if (reservation.Status === 'cancelled') {
            return res.status(400).json({
                error: 'Already cancelled',
                message: 'This reservation has already been cancelled'
            });
        }

        // Cancel reservation
        await reservation.update({
            Status: 'cancelled'
        });

        // Cancel related email reminders
        await EmailReminders.update(
            { Status: 'failed', ErrorMessage: 'Reservation cancelled by user' },
            {
                where: {
                    ReservationID: decoded.reservationId,
                    Status: 'pending'
                }
            }
        );

        console.log('✅ Reservation cancelled via email link:', {
            reservationId: decoded.reservationId,
            userId: decoded.userId
        });

        // Return success page or redirect to frontend
        const frontendUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:4200';
        const redirectUrl = `${frontendUrl}/cancel-success?reservation=${decoded.reservationId}`;
        
        res.redirect(redirectUrl);

    } catch (error) {
        console.error('❌ /jobs/cancel-reservation error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * Backfill pending room reminders for existing reservations
 * POST /jobs/seed-room-reminders
 */
router.post('/seed-room-reminders', async (req, res) => {
    try {
        const internalKey = req.headers['x-internal-key'];
        const expectedKey = process.env.X_INTERNAL_KEY || process.env.CRON_INTERNAL_KEY;

        if (!internalKey || internalKey !== expectedKey) {
            return res.status(403).json({ error: 'Forbidden - invalid internal key' });
        }

        console.log('🌱 Starting room reminders seeding...');
        const results = await calendarService.seedPendingRoomReminders();
        
        res.json({
            success: true,
            message: 'Room reminders seeding completed',
            results: results,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Room reminders seeding failed:', error);
        res.status(500).json({ 
            success: false,
            error: 'Room reminders seeding failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;
