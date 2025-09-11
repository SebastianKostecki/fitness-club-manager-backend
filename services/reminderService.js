const { Op } = require('sequelize');
const { EmailReminders, Reservations, Users, FitnessClasses, Rooms, RoomReservations } = require('../models');
const { sendTemplate } = require('./brevoService');
const jwt = require('jsonwebtoken');
const { format, subHours, differenceInMinutes } = require('date-fns');
const { zonedTimeToUtc, utcToZonedTime, format: formatTZ } = require('date-fns-tz');

class ReminderService {
    constructor() {
        this.timezone = process.env.TZ || 'Europe/Warsaw';
        this.frontendBaseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:4200';
        this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    }

    /**
     * Format UTC date to local timezone string 'yyyy-MM-dd HH:mm'
     * @param {Date} utcDate - UTC date
     * @returns {string} Formatted date in Europe/Warsaw timezone
     */
    formatDateLocal(utcDate) {
        if (!utcDate) return '';
        const localDate = utcToZonedTime(utcDate, this.timezone);
        return formatTZ(localDate, 'yyyy-MM-dd HH:mm', { timeZone: this.timezone });
    }

    /**
     * Create email reminder for a fitness class reservation
     * @param {Object} reservation - Reservation object with ClassID, UserID
     * @returns {Promise<Object>} Created reminder or null
     */
    async createReminderForReservation(reservation) {
        try {
            // Get class details
            const fitnessClass = await FitnessClasses.findByPk(reservation.ClassID, {
                include: [
                    { model: Rooms, as: 'room' },
                    { model: Users, as: 'trainer', attributes: ['UserID', 'Username', 'Email'] }
                ]
            });

            if (!fitnessClass) {
                console.error('❌ Class not found for reservation:', reservation.ReservationID);
                return null;
            }

            // Calculate scheduled time (1 hour before class)
            const classStartTime = new Date(fitnessClass.StartTime);
            const scheduledTime = subHours(classStartTime, 1);

            // Generate cancel token
            const cancelToken = this.generateCancelToken(reservation.ReservationID, reservation.UserID);

            // Create reminder record
            const reminder = await EmailReminders.create({
                ReservationID: reservation.ReservationID,
                UserID: reservation.UserID,
                ClassID: reservation.ClassID,
                ScheduledTime: scheduledTime,
                Status: 'pending',
                CancelToken: cancelToken
            });

            console.log('✅ Email reminder created:', {
                reminderID: reminder.EmailReminderID,
                reservationID: reservation.ReservationID,
                scheduledTime: scheduledTime.toISOString(),
                className: fitnessClass.Title
            });

            return reminder;

        } catch (error) {
            console.error('❌ Failed to create email reminder:', {
                error: error.message,
                reservationID: reservation.ReservationID
            });
            return null;
        }
    }

    /**
     * Create email reminder for a room reservation
     * @param {Object} roomReservation - RoomReservation object with RoomReservationID, CreatedByUserID
     * @returns {Promise<Object>} Created reminder or null
     */
    async createReminderForRoomReservation(roomReservation) {
        try {
            // Get room reservation details with room and user
            const reservation = await RoomReservations.findByPk(roomReservation.RoomReservationID, {
                include: [
                    { model: Rooms, as: 'room' },
                    { model: Users, as: 'user', attributes: ['UserID', 'Username', 'Email'] }
                ]
            });

            if (!reservation) {
                console.error('❌ Room reservation not found:', roomReservation.RoomReservationID);
                return null;
            }

            // Calculate scheduled time (1 hour before reservation)
            const reservationStartTime = new Date(reservation.StartTime);
            const scheduledTime = subHours(reservationStartTime, 1);

            // Generate cancel token for room reservation
            const cancelToken = this.generateRoomReservationCancelToken(
                reservation.RoomReservationID, 
                reservation.CreatedByUserID
            );

            // Create reminder record
            const reminder = await EmailReminders.create({
                RoomReservationID: reservation.RoomReservationID,
                UserID: reservation.CreatedByUserID,
                ClassID: null,  // No class for room reservations
                ScheduledTime: scheduledTime,
                Status: 'pending',
                CancelToken: cancelToken
            });

            console.log('✅ Room reservation email reminder created:', {
                reminderID: reminder.EmailReminderID,
                roomReservationID: reservation.RoomReservationID,
                scheduledTime: scheduledTime.toISOString(),
                roomTitle: reservation.Title,
                roomName: reservation.room?.RoomName
            });

            return reminder;

        } catch (error) {
            console.error('❌ Failed to create room reservation email reminder:', {
                error: error.message,
                roomReservationID: roomReservation.RoomReservationID
            });
            return null;
        }
    }

    /**
     * Process pending reminders that are due to be sent
     * @returns {Promise<Object>} Processing results
     */
    async processPendingReminders() {
        try {
            const now = new Date();
            
            // Find pending reminders that are due (both class and room reservations)
            const pendingReminders = await EmailReminders.findAll({
                where: {
                    Status: 'pending',
                    ScheduledTime: {
                        [Op.lte]: now
                    }
                },
                include: [
                    {
                        model: Users,
                        as: 'user',
                        attributes: ['UserID', 'Username', 'Email']
                    },
                    {
                        model: Reservations,
                        as: 'reservation',
                        required: false, // LEFT JOIN - optional for room reservations
                        where: { Status: { [Op.in]: ['pending', 'confirmed'] } }
                    },
                    {
                        model: FitnessClasses,
                        as: 'fitness_class',
                        required: false, // LEFT JOIN - optional for room reservations
                        include: [
                            { model: Rooms, as: 'room' },
                            { model: Users, as: 'trainer', attributes: ['UserID', 'Username'] }
                        ]
                    },
                    {
                        model: RoomReservations,
                        as: 'room_reservation',
                        required: false, // LEFT JOIN - optional for class reservations
                        where: { Status: 'Active' }, // Only active room reservations
                        include: [
                            { model: Rooms, as: 'room' },
                            { model: Users, as: 'user', attributes: ['UserID', 'Username', 'Email'] }
                        ]
                    }
                ],
                limit: 50 // Process max 50 at a time
            });

            console.log(`📧 Processing ${pendingReminders.length} pending reminders...`);

            const results = {
                processed: 0,
                sent: 0,
                failed: 0,
                errors: []
            };

            for (const reminder of pendingReminders) {
                results.processed++;
                
                try {
                    const success = await this.sendReminderEmail(reminder);
                    if (success) {
                        results.sent++;
                    } else {
                        results.failed++;
                    }
                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        reminderID: reminder.EmailReminderID,
                        error: error.message
                    });
                }
            }

            console.log('📊 Reminder processing complete:', results);
            return results;

        } catch (error) {
            console.error('❌ Failed to process pending reminders:', error);
            throw error;
        }
    }

    /**
     * Send individual reminder email
     * @param {Object} reminder - EmailReminder with associations
     * @returns {Promise<boolean>} Success status
     */
    async sendReminderEmail(reminder) {
        try {
            const user = reminder.user;
            
            // Check if this is a fitness class or room reservation reminder
            if (reminder.ClassID && reminder.fitness_class) {
                return await this.sendClassReminderEmail(reminder);
            } else if (reminder.RoomReservationID && reminder.room_reservation) {
                return await this.sendRoomReminderEmail(reminder);
            } else {
                console.error('❌ Invalid reminder type - missing class or room reservation data:', {
                    reminderID: reminder.EmailReminderID,
                    classID: reminder.ClassID,
                    roomReservationID: reminder.RoomReservationID
                });
                return false;
            }
        } catch (error) {
            console.error('❌ Failed to send reminder email:', {
                reminderID: reminder.EmailReminderID,
                error: error.message
            });

            // Update reminder as failed
            try {
                await reminder.update({
                    Status: 'failed',
                    ErrorMessage: error.message
                });
            } catch (updateError) {
                console.error('❌ Failed to update reminder status:', updateError);
            }

            return false;
        }
    }

    /**
     * Send fitness class reminder email
     * @param {Object} reminder - EmailReminder with fitness class associations
     * @returns {Promise<boolean>} Success status
     */
    async sendClassReminderEmail(reminder) {
        const user = reminder.user;
        const fitnessClass = reminder.fitness_class;
        const room = fitnessClass.room;
        const trainer = fitnessClass.trainer;

        // Extract first name from username (fallback logic)
        const firstName = this.extractFirstName(user.Username);

        // Format start time in local timezone
        const startTimeUTC = new Date(fitnessClass.StartTime);
        const startTimeLocal = utcToZonedTime(startTimeUTC, this.timezone);
        const startTimeFormatted = formatTZ(startTimeLocal, 'yyyy-MM-dd HH:mm', { timeZone: this.timezone });

        // Calculate duration in minutes
        const endTimeUTC = new Date(fitnessClass.EndTime);
        const duration = differenceInMinutes(endTimeUTC, startTimeUTC);

        // Generate cancel URL
        const cancelUrl = `${this.frontendBaseUrl}/cancel-reservation?token=${reminder.CancelToken}`;

        // Prepare email parameters
        const emailParams = {
            email: user.Email,
            firstName: firstName,
            className: fitnessClass.Title,
            roomName: room ? room.RoomName : 'Sala nieznana',
            trainerName: trainer ? trainer.Username : 'Trener nieznany',
            startTimeLocal: startTimeFormatted,
            duration: duration,
            cancelUrl: cancelUrl
        };

        try {
            // Send email via Brevo template (class = template #1)
            const result = await sendTemplate({
                to: emailParams.email,
                templateId: 1, // Classes with trainer
                params: {
                    firstName: emailParams.firstName,
                    className: emailParams.className,
                    roomName: emailParams.roomName,
                    trainerName: emailParams.trainerName,
                    startTimeLocal: this.formatDateLocal(startTimeUTC),
                    duration: duration.toString(),
                    cancelUrl: emailParams.cancelUrl
                }
            });

            // Update reminder status - handle both SDK formats
            const messageId = result?.body?.messageId || result?.messageId || result?.id;
            if (result && messageId) {
                await reminder.update({
                    Status: 'sent',
                    SentAt: new Date(),
                    BrevoMessageId: messageId
                });
                console.log('✅ Fitness class email reminder sent successfully:', {
                    reminderID: reminder.EmailReminderID,
                    messageId: messageId
                });
                return true;
            } else {
                console.error('❌ Unexpected Brevo response format:', result);
                await reminder.update({
                    Status: 'failed',
                    ErrorMessage: 'Unknown response format: ' + JSON.stringify(result)
                });
                return false;
            }

        } catch (error) {
            console.error('❌ Failed to send reminder email:', {
                reminderID: reminder.EmailReminderID,
                error: error.message
            });

            // Update reminder as failed
            try {
                await reminder.update({
                    Status: 'failed',
                    ErrorMessage: error.message
                });
            } catch (updateError) {
                console.error('❌ Failed to update reminder status:', updateError);
            }

            return false;
        }
    }

    /**
     * Send room reservation reminder email
     * @param {Object} reminder - EmailReminder with room reservation associations
     * @returns {Promise<boolean>} Success status
     */
    async sendRoomReminderEmail(reminder) {
        const user = reminder.user;
        const roomReservation = reminder.room_reservation;
        const room = roomReservation.room;

        // Extract first name from username (fallback logic)
        const firstName = this.extractFirstName(user.Username);

        // Format start time in local timezone
        const startTimeUTC = new Date(roomReservation.StartTime);
        const startTimeLocal = utcToZonedTime(startTimeUTC, this.timezone);
        const startTimeFormatted = formatTZ(startTimeLocal, 'yyyy-MM-dd HH:mm', { timeZone: this.timezone });

        // Calculate duration in minutes
        const endTimeUTC = new Date(roomReservation.EndTime);
        const duration = differenceInMinutes(endTimeUTC, startTimeUTC);

        // Generate cancel URL for room reservation
        const cancelUrl = `${this.frontendBaseUrl}/cancel-room-reservation?token=${reminder.CancelToken}`;

        // Prepare email parameters for room reservation
        const emailParams = {
            email: user.Email,
            firstName: firstName,
            className: roomReservation.Title || 'Rezerwacja sali', // Use reservation title as "class name"
            roomName: room ? room.RoomName : 'Sala nieznana',
            trainerName: 'Rezerwacja osobista', // No trainer for room reservations
            startTimeLocal: startTimeFormatted,
            duration: duration,
            cancelUrl: cancelUrl
        };

        try {
            // Send email via Brevo template (personal room = template #2)
            const result = await sendTemplate({
                to: emailParams.email,
                templateId: 2, // Personal room reservations
                params: {
                    firstName: emailParams.firstName,
                    className: emailParams.className,
                    roomName: emailParams.roomName,
                    trainerName: emailParams.trainerName,
                    startTimeLocal: this.formatDateLocal(startTimeUTC),
                    duration: duration.toString(),
                    cancelUrl: emailParams.cancelUrl
                }
            });

            // Update reminder status - handle both SDK formats
            const messageId = result?.body?.messageId || result?.messageId || result?.id;
            if (result && messageId) {
                await reminder.update({
                    Status: 'sent',
                    SentAt: new Date(),
                    BrevoMessageId: messageId
                });
                console.log('✅ Room reservation email reminder sent successfully:', {
                    reminderID: reminder.EmailReminderID,
                    messageId: messageId,
                    roomName: room?.RoomName,
                    reservationTitle: roomReservation.Title
                });
                return true;
            } else {
                console.error('❌ Unexpected Brevo response format:', result);
                await reminder.update({
                    Status: 'failed',
                    ErrorMessage: 'Unknown response format: ' + JSON.stringify(result)
                });
                return false;
            }

        } catch (error) {
            console.error('❌ Failed to send room reservation reminder email:', {
                reminderID: reminder.EmailReminderID,
                error: error.message
            });

            // Update reminder as failed
            try {
                await reminder.update({
                    Status: 'failed',
                    ErrorMessage: error.message
                });
            } catch (updateError) {
                console.error('❌ Failed to update reminder status:', updateError);
            }

            return false;
        }
    }

    /**
     * Generate JWT token for secure cancellation (fitness class reservation)
     * @param {number} reservationId - Reservation ID
     * @param {number} userId - User ID
     * @returns {string} JWT token
     */
    generateCancelToken(reservationId, userId) {
        const payload = {
            reservationId: reservationId,
            userId: userId,
            type: 'cancel',
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
        };
        
        return jwt.sign(payload, this.jwtSecret);
    }

    /**
     * Generate JWT token for secure room reservation cancellation
     * @param {number} roomReservationId - Room Reservation ID
     * @param {number} userId - User ID
     * @returns {string} JWT token
     */
    generateRoomReservationCancelToken(roomReservationId, userId) {
        const payload = {
            roomReservationId: roomReservationId,
            userId: userId,
            type: 'cancel_room',
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
        };
        
        return jwt.sign(payload, this.jwtSecret);
    }

    /**
     * Verify and decode cancel token
     * @param {string} token - JWT token
     * @returns {Object|null} Decoded payload or null if invalid
     */
    verifyCancelToken(token) {
        try {
            const decoded = jwt.verify(token, this.jwtSecret);
            if (decoded.type === 'cancel') {
                return decoded;
            }
            return null;
        } catch (error) {
            console.error('❌ Invalid cancel token:', error.message);
            return null;
        }
    }

    /**
     * Extract first name from username
     * @param {string} username - Full username
     * @returns {string} First name or fallback
     */
    extractFirstName(username) {
        if (!username) return 'Kliencie';
        
        // Split by space and take first part
        const parts = username.trim().split(' ');
        const firstName = parts[0];
        
        // Return first name or fallback
        return firstName && firstName.length > 1 ? firstName : 'Kliencie';
    }

    /**
     * Get reminder statistics
     * @returns {Promise<Object>} Statistics
     */
    async getStatistics() {
        try {
            const stats = await EmailReminders.findAll({
                attributes: [
                    'Status',
                    [EmailReminders.sequelize.fn('COUNT', '*'), 'count']
                ],
                group: ['Status'],
                raw: true
            });

            const result = {
                pending: 0,
                sent: 0,
                failed: 0,
                total: 0
            };

            stats.forEach(stat => {
                result[stat.Status] = parseInt(stat.count);
                result.total += parseInt(stat.count);
            });

            return result;
        } catch (error) {
            console.error('❌ Failed to get reminder statistics:', error);
            return { pending: 0, sent: 0, failed: 0, total: 0 };
        }
    }
}

module.exports = new ReminderService();
