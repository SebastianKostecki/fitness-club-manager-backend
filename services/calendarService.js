const { Op } = require('sequelize');
const { sequelize, FitnessClasses, RoomReservations, Rooms, Users, Reservations } = require('../models');
const reminderService = require('./reminderService');

class CalendarService {
    /**
     * Reserve a room for direct booking (not fitness class)
     * @param {Object} params - Reservation parameters
     * @param {number} params.roomId - Room ID
     * @param {number} params.userId - User ID making the reservation
     * @param {Date} params.startTime - Start time
     * @param {Date} params.endTime - End time
     * @param {string} params.title - Reservation title
     * @returns {Promise<Object>} Created reservation or error
     */
    async reserveRoom({ roomId, userId, startTime, endTime, title = 'Rezerwacja sali' }) {
        const transaction = await sequelize.transaction();
        
        try {
            // Validate input
            if (!roomId || !userId || !startTime || !endTime) {
                throw new Error('Missing required parameters');
            }

            const start = new Date(startTime);
            const end = new Date(endTime);

            if (start >= end) {
                throw new Error('End time must be after start time');
            }

            if (start <= new Date()) {
                throw new Error('Cannot book in the past');
            }

            // Check if room exists
            const room = await Rooms.findByPk(roomId, { transaction });
            if (!room) {
                throw new Error('Room not found');
            }

            // Check for conflicts with existing room reservations (using FOR UPDATE)
            const conflictingRoomReservations = await RoomReservations.findAll({
                where: {
                    RoomID: roomId,
                    Status: 'Active',
                    [Op.and]: [
                        { StartTime: { [Op.lt]: end } },
                        { EndTime: { [Op.gt]: start } }
                    ]
                },
                lock: transaction.LOCK.UPDATE,
                transaction
            });

            if (conflictingRoomReservations.length > 0) {
                throw new Error('Room is already reserved for this time period');
            }

            // Check for conflicts with fitness classes in the same room
            const conflictingClasses = await FitnessClasses.findAll({
                where: {
                    RoomID: roomId,
                    Status: 'Active',
                    [Op.and]: [
                        { StartTime: { [Op.lt]: end } },
                        { EndTime: { [Op.gt]: start } }
                    ]
                },
                lock: transaction.LOCK.UPDATE,
                transaction
            });

            if (conflictingClasses.length > 0) {
                throw new Error('Room is occupied by fitness classes during this time');
            }

            // Create the reservation
            const reservation = await RoomReservations.create({
                RoomID: roomId,
                CreatedByUserID: userId,
                Title: title,
                StartTime: start,
                EndTime: end,
                Status: 'Active'
            }, { transaction });

            await transaction.commit();
            
            // Get the full reservation with details
            const fullReservation = await RoomReservations.findByPk(reservation.RoomReservationID, {
                include: [
                    { model: Rooms, as: 'room' },
                    { model: Users, as: 'user', attributes: ['UserID', 'Username', 'Email'] }
                ]
            });

            // Create email reminder for the room reservation
            try {
                await this.scheduleRoomReminder(fullReservation);
                console.log('✅ Email reminder scheduled for room reservation:', fullReservation.RoomReservationID);
            } catch (reminderError) {
                console.error('❌ Failed to schedule email reminder for room reservation:', reminderError.message);
                // Don't fail the reservation creation if reminder fails
            }
            
            return fullReservation;

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Create a fitness class with conflict validation
     * @param {Object} params - Class parameters
     * @param {number} params.trainerId - Trainer ID
     * @param {number} params.roomId - Room ID
     * @param {Date} params.startTime - Start time
     * @param {Date} params.endTime - End time
     * @param {string} params.title - Class title
     * @param {number} params.capacity - Class capacity
     * @returns {Promise<Object>} Created class or error
     */
    async createClass({ trainerId, roomId, startTime, endTime, title, capacity }) {
        const transaction = await sequelize.transaction();
        
        try {
            // Validate input
            if (!trainerId || !roomId || !startTime || !endTime || !title || !capacity) {
                throw new Error('Missing required parameters');
            }

            const start = new Date(startTime);
            const end = new Date(endTime);

            if (start >= end) {
                throw new Error('End time must be after start time');
            }

            if (start <= new Date()) {
                throw new Error('Cannot schedule class in the past');
            }

            // Check if trainer exists and is actually a trainer
            const trainer = await Users.findByPk(trainerId, { transaction });
            if (!trainer || trainer.Role !== 'trainer') {
                throw new Error('Invalid trainer');
            }

            // Check if room exists and has sufficient capacity
            const room = await Rooms.findByPk(roomId, { transaction });
            if (!room) {
                throw new Error('Room not found');
            }

            if (capacity > room.Capacity) {
                throw new Error(`Class capacity (${capacity}) exceeds room capacity (${room.Capacity})`);
            }

            // Check for trainer conflicts (trainer can't be in two places at once)
            const trainerConflicts = await FitnessClasses.findAll({
                where: {
                    TrainerID: trainerId,
                    Status: 'Active',
                    [Op.and]: [
                        { StartTime: { [Op.lt]: end } },
                        { EndTime: { [Op.gt]: start } }
                    ]
                },
                lock: transaction.LOCK.UPDATE,
                transaction
            });

            if (trainerConflicts.length > 0) {
                throw new Error('Trainer is already scheduled for another class during this time');
            }

            // Check for room conflicts with other classes
            const roomClassConflicts = await FitnessClasses.findAll({
                where: {
                    RoomID: roomId,
                    Status: 'Active',
                    [Op.and]: [
                        { StartTime: { [Op.lt]: end } },
                        { EndTime: { [Op.gt]: start } }
                    ]
                },
                lock: transaction.LOCK.UPDATE,
                transaction
            });

            if (roomClassConflicts.length > 0) {
                throw new Error('Room is already occupied by another class during this time');
            }

            // Check for room conflicts with direct reservations
            const roomReservationConflicts = await RoomReservations.findAll({
                where: {
                    RoomID: roomId,
                    Status: 'Active',
                    [Op.and]: [
                        { StartTime: { [Op.lt]: end } },
                        { EndTime: { [Op.gt]: start } }
                    ]
                },
                lock: transaction.LOCK.UPDATE,
                transaction
            });

            if (roomReservationConflicts.length > 0) {
                throw new Error('Room is already reserved during this time');
            }

            // Create the fitness class
            const fitnessClass = await FitnessClasses.create({
                TrainerID: trainerId,
                RoomID: roomId,
                Title: title,
                StartTime: start,
                EndTime: end,
                Capacity: capacity,
                Status: 'Active'
            }, { transaction });

            await transaction.commit();

            // Return with full details
            return await FitnessClasses.findByPk(fitnessClass.ClassID, {
                include: [
                    { model: Users, as: 'trainer', attributes: ['UserID', 'Username', 'Email'] },
                    { model: Rooms, as: 'room' }
                ]
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Get room availability for a specific date
     * @param {number} roomId - Room ID
     * @param {Date} date - Date to check
     * @returns {Promise<Object>} Occupied time slots
     */
    async getRoomAvailability(roomId, date) {
        try {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            // Get all fitness classes for this room on this date
            const fitnessClasses = await FitnessClasses.findAll({
                where: {
                    RoomID: roomId,
                    StartTime: { [Op.between]: [startOfDay, endOfDay] },
                    Status: 'Active'
                },
                include: [
                    { model: Users, as: 'trainer', attributes: ['Username'] }
                ]
            });

            // Get all room reservations for this room on this date
            const roomReservations = await RoomReservations.findAll({
                where: {
                    RoomID: roomId,
                    StartTime: { [Op.between]: [startOfDay, endOfDay] },
                    Status: 'Active'
                },
                include: [
                    { model: Users, as: 'user', attributes: ['Username'] }
                ]
            });

            // Format occupied slots
            const occupiedSlots = [
                ...fitnessClasses.map(fc => ({
                    id: fc.ClassID,
                    start: fc.StartTime,
                    end: fc.EndTime,
                    type: 'fitness_class',
                    title: fc.Title,
                    trainer: fc.trainer?.Username,
                    capacity: fc.Capacity
                })),
                ...roomReservations.map(rr => ({
                    id: rr.RoomReservationID,
                    start: rr.StartTime,
                    end: rr.EndTime,
                    type: 'room_reservation',
                    title: rr.Title,
                    user: rr.user?.Username
                }))
            ];

            // Sort by start time
            occupiedSlots.sort((a, b) => new Date(a.start) - new Date(b.start));

            return { occupiedSlots };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Get user's calendar data (their reservations and classes)
     * @param {number} userId - User ID
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @param {string} userRole - User role (regular, trainer, admin)
     * @returns {Promise<Object>} Calendar events
     */
    async getUserCalendar(userId, startDate, endDate, userRole) {
        try {
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            let events = [];

            if (userRole === 'regular' || userRole === 'admin') {
                // Get user's class reservations
                const classReservations = await Reservations.findAll({
                    where: {
                        UserID: userId,
                        Status: { [Op.in]: ['pending', 'confirmed'] }
                    },
                    include: [
                        {
                            model: FitnessClasses,
                            as: 'fitness_class',
                            where: {
                                StartTime: { [Op.between]: [start, end] },
                                Status: 'Active'
                            },
                            include: [
                                { model: Rooms, as: 'room' },
                                { model: Users, as: 'trainer', attributes: ['Username'] }
                            ]
                        }
                    ]
                });

                // Get user's room reservations
                const roomReservations = await RoomReservations.findAll({
                    where: {
                        CreatedByUserID: userId,
                        StartTime: { [Op.between]: [start, end] },
                        Status: 'Active'
                    },
                    include: [
                        { model: Rooms, as: 'room' }
                    ]
                });

                // Format class reservations
                events = events.concat(classReservations.map(cr => ({
                    id: `class-${cr.fitness_class.ClassID}`,
                    title: cr.fitness_class.Title,
                    start: cr.fitness_class.StartTime,
                    end: cr.fitness_class.EndTime,
                    type: 'class_reservation',
                    roomName: cr.fitness_class.room?.RoomName,
                    trainer: cr.fitness_class.trainer?.Username,
                    status: cr.Status
                })));

                // Format room reservations
                events = events.concat(roomReservations.map(rr => ({
                    id: `room-${rr.RoomReservationID}`,
                    title: rr.Title,
                    start: rr.StartTime,
                    end: rr.EndTime,
                    type: 'room_reservation',
                    roomName: rr.room?.RoomName,
                    status: rr.Status
                })));
            }

            if (userRole === 'trainer' || userRole === 'admin') {
                // Get trainer's classes
                const trainerClasses = await FitnessClasses.findAll({
                    where: {
                        TrainerID: userId,
                        StartTime: { [Op.between]: [start, end] },
                        Status: 'Active'
                    },
                    include: [
                        { model: Rooms, as: 'room' },
                        { 
                            model: Reservations, 
                            as: 'reservations',
                            where: { Status: { [Op.in]: ['pending', 'confirmed'] } },
                            required: false
                        }
                    ]
                });

                // Format trainer classes
                events = events.concat(trainerClasses.map(tc => ({
                    id: `trainer-class-${tc.ClassID}`,
                    title: tc.Title,
                    start: tc.StartTime,
                    end: tc.EndTime,
                    type: 'trainer_class',
                    roomName: tc.room?.RoomName,
                    capacity: tc.Capacity,
                    bookings: tc.reservations?.length || 0,
                    status: tc.Status
                })));
            }

            // Sort events by start time
            events.sort((a, b) => new Date(a.start) - new Date(b.start));

            return { events };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Schedule email reminder for room reservation
     * @param {Object} roomReservation - RoomReservation with user and room data
     * @returns {Promise<Object>} Created reminder or null
     */
    async scheduleRoomReminder(roomReservation) {
        const { EmailReminders } = require('../models');
        const { v4: uuidv4 } = require('uuid');
        const { subHours } = require('date-fns');

        try {
            // Check if reminder already exists to avoid duplicates
            const existingReminder = await EmailReminders.findOne({
                where: {
                    RoomReservationID: roomReservation.RoomReservationID,
                    Status: 'pending'
                }
            });

            if (existingReminder) {
                console.log('⚠️ Reminder already exists for room reservation:', roomReservation.RoomReservationID);
                return existingReminder;
            }

            // Calculate scheduled time (60 minutes before reservation)
            const reservationStartTime = new Date(roomReservation.StartTime);
            const scheduledTime = subHours(reservationStartTime, 1);

            // Generate unique cancel token
            const cancelToken = uuidv4();

            // Create reminder record
            const reminder = await EmailReminders.create({
                RoomReservationID: roomReservation.RoomReservationID,
                UserID: roomReservation.CreatedByUserID,
                ReservationID: null,  // No class reservation
                ClassID: null,        // No fitness class
                ScheduledTime: scheduledTime,
                Status: 'pending',
                CancelToken: cancelToken
            });

            console.log('✅ Room reminder scheduled:', {
                reminderID: reminder.EmailReminderID,
                roomReservationID: roomReservation.RoomReservationID,
                scheduledTime: scheduledTime.toISOString(),
                roomTitle: roomReservation.Title
            });

            return reminder;

        } catch (error) {
            console.error('❌ Failed to schedule room reminder:', {
                error: error.message,
                roomReservationID: roomReservation.RoomReservationID
            });
            throw error;
        }
    }

    /**
     * Backfill pending room reminders for existing reservations
     * @returns {Promise<Object>} Results summary
     */
    async seedPendingRoomReminders() {
        const { EmailReminders } = require('../models');
        const { v4: uuidv4 } = require('uuid');
        const { subHours } = require('date-fns');

        try {
            console.log('🌱 Seeding pending room reminders...');

            // Find future active room reservations without reminders
            const futureReservations = await RoomReservations.findAll({
                where: {
                    StartTime: {
                        [Op.gt]: new Date() // Future reservations only
                    },
                    Status: 'Active'
                },
                include: [
                    {
                        model: EmailReminders,
                        as: 'email_reminders',
                        required: false
                    }
                ]
            });

            const reservationsNeedingReminders = futureReservations.filter(rr => 
                !rr.email_reminders || rr.email_reminders.length === 0
            );

            console.log(`📊 Found ${reservationsNeedingReminders.length} reservations needing reminders`);

            const results = {
                processed: 0,
                created: 0,
                skipped: 0,
                errors: []
            };

            for (const reservation of reservationsNeedingReminders) {
                results.processed++;
                
                try {
                    const reservationStartTime = new Date(reservation.StartTime);
                    const scheduledTime = subHours(reservationStartTime, 1);

                    // Skip if scheduled time is in the past
                    if (scheduledTime <= new Date()) {
                        console.log(`⏰ Skipping past reminder for reservation ${reservation.RoomReservationID}`);
                        results.skipped++;
                        continue;
                    }

                    const cancelToken = uuidv4();

                    await EmailReminders.create({
                        RoomReservationID: reservation.RoomReservationID,
                        UserID: reservation.CreatedByUserID,
                        ReservationID: null,
                        ClassID: null,
                        ScheduledTime: scheduledTime,
                        Status: 'pending',
                        CancelToken: cancelToken
                    });

                    results.created++;
                    console.log(`✅ Created reminder for reservation ${reservation.RoomReservationID}`);

                } catch (error) {
                    console.error(`❌ Failed to create reminder for reservation ${reservation.RoomReservationID}:`, error.message);
                    results.errors.push({
                        reservationID: reservation.RoomReservationID,
                        error: error.message
                    });
                }
            }

            console.log('📊 Seeding completed:', results);
            return results;

        } catch (error) {
            console.error('❌ Failed to seed room reminders:', error);
            throw error;
        }
    }
}

module.exports = new CalendarService();
