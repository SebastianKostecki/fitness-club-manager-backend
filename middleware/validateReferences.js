const { Users, FitnessClasses, Rooms, Reservations } = require('../models');

/**
 * Middleware to validate that referenced entities exist
 * Replaces database-level FK constraints with application-level validation
 */

// Validate UserID exists
const validateUserExists = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { UserID } = req.body;
        
        const idToCheck = userId || UserID;
        if (!idToCheck) {
            return next(); // No user ID to validate
        }

        const user = await Users.findByPk(idToCheck);
        if (!user) {
            return res.status(404).json({ 
                error: 'User not found',
                message: `User with ID ${idToCheck} does not exist`
            });
        }

        req.validatedUser = user;
        next();
    } catch (error) {
        console.error('Error validating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Validate ClassID exists
const validateClassExists = async (req, res, next) => {
    try {
        const { classId } = req.params;
        const { ClassID } = req.body;
        
        const idToCheck = classId || ClassID;
        if (!idToCheck) {
            return next(); // No class ID to validate
        }

        const fitnessClass = await FitnessClasses.findByPk(idToCheck);
        if (!fitnessClass) {
            return res.status(404).json({ 
                error: 'Fitness class not found',
                message: `Fitness class with ID ${idToCheck} does not exist`
            });
        }

        req.validatedClass = fitnessClass;
        next();
    } catch (error) {
        console.error('Error validating fitness class:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Validate RoomID exists
const validateRoomExists = async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const { RoomID } = req.body;
        
        const idToCheck = roomId || RoomID;
        if (!idToCheck) {
            return next(); // No room ID to validate
        }

        const room = await Rooms.findByPk(idToCheck);
        if (!room) {
            return res.status(404).json({ 
                error: 'Room not found',
                message: `Room with ID ${idToCheck} does not exist`
            });
        }

        req.validatedRoom = room;
        next();
    } catch (error) {
        console.error('Error validating room:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Validate ReservationID exists
const validateReservationExists = async (req, res, next) => {
    try {
        const { reservationId } = req.params;
        const { ReservationID } = req.body;
        
        const idToCheck = reservationId || ReservationID;
        if (!idToCheck) {
            return next(); // No reservation ID to validate
        }

        const reservation = await Reservations.findByPk(idToCheck);
        if (!reservation) {
            return res.status(404).json({ 
                error: 'Reservation not found',
                message: `Reservation with ID ${idToCheck} does not exist`
            });
        }

        req.validatedReservation = reservation;
        next();
    } catch (error) {
        console.error('Error validating reservation:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Validate multiple references in request body
const validateReservationReferences = async (req, res, next) => {
    try {
        const { UserID, ClassID } = req.body;
        
        // Validate UserID
        if (UserID) {
            const user = await Users.findByPk(UserID);
            if (!user) {
                return res.status(404).json({ 
                    error: 'User not found',
                    message: `User with ID ${UserID} does not exist`
                });
            }
        }

        // Validate ClassID
        if (ClassID) {
            const fitnessClass = await FitnessClasses.findByPk(ClassID);
            if (!fitnessClass) {
                return res.status(404).json({ 
                    error: 'Fitness class not found',
                    message: `Fitness class with ID ${ClassID} does not exist`
                });
            }
        }

        next();
    } catch (error) {
        console.error('Error validating reservation references:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Validate room reservation references
const validateRoomReservationReferences = async (req, res, next) => {
    try {
        const { RoomID, CreatedByUserID } = req.body;
        
        // Validate RoomID
        if (RoomID) {
            const room = await Rooms.findByPk(RoomID);
            if (!room) {
                return res.status(404).json({ 
                    error: 'Room not found',
                    message: `Room with ID ${RoomID} does not exist`
                });
            }
        }

        // Validate CreatedByUserID
        if (CreatedByUserID) {
            const user = await Users.findByPk(CreatedByUserID);
            if (!user) {
                return res.status(404).json({ 
                    error: 'User not found',
                    message: `User with ID ${CreatedByUserID} does not exist`
                });
            }
        }

        next();
    } catch (error) {
        console.error('Error validating room reservation references:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    validateUserExists,
    validateClassExists,
    validateRoomExists,
    validateReservationExists,
    validateReservationReferences,
    validateRoomReservationReferences
};
