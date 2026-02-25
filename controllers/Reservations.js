const { Reservations, Users, FitnessClasses, Rooms, RoomReservations } = require("../models");
const reminderService = require("../services/reminderService");
const sequelize = require('../config/sequelize');

// GET wszystkie rezerwacje
const getReservations = async (req, res) => {
  try {
    const role = req.headers["auth-role"]
    let reservations
    if (role === "regular"){
      reservations = await Reservations.findAll({
        where: {UserID: req.user.id}, //zaweza rekordy po id uzytkownika
        include: [
          { model: Users, attributes: ['Username', 'Email'] },
          { model: FitnessClasses,
            as: 'fitness_class',
            include: [
              {model:Rooms, as: 'room'}
            ]
          }
        ]
      });
    } else {
      reservations = await Reservations.findAll({
        include: [
          { model: Users, attributes: ['Username', 'Email'] },
          { model: FitnessClasses,
            as: 'fitness_class',
            include: [
              {model:Rooms, as: 'room'}
            ]
          }
        ]
      });
    }
    return res.send(reservations);
  } catch (err) {
    console.error("Błąd przy pobieraniu rezerwacji:", err);
    res.status(500).send({ message: "Błąd serwera" });
  }
};

// GET rezerwacja po ID
const getReservationById = async (req, res) => {
  try {
    const reservation = await Reservations.findOne({
      where: { ReservationID: req.params.id },
      include: [
        { model: Users, attributes: ['Username', 'Email'] },
        { model: FitnessClasses,
            as: 'fitness_class',
            include: [
              {model:Rooms, as: 'room'}
            ]
        }
      ]
    });

    if (!reservation) {
      return res.status(404).send({ message: "Rezerwacja nie znaleziona." });
    }

    return res.send(reservation);
  } catch (err) {
    res.status(500).send({ message: "Błąd serwera" });
  }
};

// POST utworzenie rezerwacji
const createReservation = async (req, res) => {
  try {
    const { UserID, Status, ClassID } = req.body;

    // 🔍 Pobierz klasę
    const fitnessClass = await FitnessClasses.findByPk(ClassID);

    if (!fitnessClass) {
      return res.status(404).json({ message: "Class not found." });
    }

    const now = new Date();
    const classStart = new Date(fitnessClass.StartTime);

    // 🚫 Blokada zapisu po rozpoczęciu
    if (now >= classStart) {
      return res.status(400).json({
        message: "Cannot register for a class that has already started or finished."
      });
    }
    
    // 🚫 Sprawdź czy użytkownik już jest zapisany na te zajęcia
    const existingReservation = await Reservations.findOne({
      where: {
        UserID,
        ClassID,
        Status: ['confirmed', 'pending']
      }
    });

    if (existingReservation) {
      return res.status(400).json({
        message: "You are already registered for this class."
      });
    }

    const newReservation = await Reservations.create({ UserID, Status, ClassID });

    // Email reminder
    if (Status === 'confirmed' || Status === 'pending') {
      try {
        await reminderService.createReminderForReservation(newReservation);
      } catch (reminderError) {
        console.error('Reminder error:', reminderError.message);
      }
    }

    return res.status(201).send(newReservation);

  } catch (err) {
    console.error("Błąd przy tworzeniu rezerwacji:", err);
    res.status(500).send({ message: "Błąd serwera" });
  }
};

// PUT aktualizacja rezerwacji
const updateReservation = async (req, res) => {
  try {
    const { Status, ClassID } = req.body;
    const reservation = await Reservations.findByPk(req.params.id);
    const userRole = req.headers['auth-role'] || req.user?.Role;
    const userId = req.user?.UserID || req.user?.id;

    if (!reservation) {
      return res.status(404).send({ message: "Nie znaleziono rezerwacji." });
    }

    // Users can only update their own reservations, admin/receptionist can update any
    if (userRole !== 'admin' && userRole !== 'receptionist' && reservation.UserID != userId) {
      return res.status(403).json({ 
        message: "Access denied. You can only manage your own reservations." 
      });
    }

    await reservation.update({ Status, ClassID });
    return res.send({ message: "Rezerwacja zaktualizowana." });
  } catch (err) {
    console.error("Błąd przy aktualizacji rezerwacji:", err);
    res.status(500).send({ message: "Błąd serwera" });
  }
};

// DELETE rezerwacja
const deleteReservation = async (req, res) => {
  try {
    const reservation = await Reservations.findByPk(req.params.id);

    const userRole = req.headers['auth-role'] || req.user?.Role;
    const userId = req.user?.UserID || req.user?.id;

    if (!reservation) {
      return res.status(404).send({ message: "Nie znaleziono rezerwacji." });
    }

    // 🔒 Dostęp
    if (userRole !== 'admin' && userRole !== 'receptionist' && reservation.UserID != userId) {
      return res.status(403).json({
        message: "Access denied. You can only manage your own reservations."
      });
    }

    // 🔍 Pobierz klasę
    const fitnessClass = await FitnessClasses.findByPk(reservation.ClassID);

    if (fitnessClass) {
      const now = new Date();
      const classStart = new Date(fitnessClass.StartTime);

      // ❌ Nikt nie może anulować po rozpoczęciu
      if (now >= classStart) {
        return res.status(400).json({
          message: "Cannot cancel a class that has already started."
        });
      }

      // ❌ 2h blokada dla zwykłych userów
      if (userRole !== 'admin' && userRole !== 'receptionist') {
        const twoHoursBeforeStart = new Date(classStart);
        twoHoursBeforeStart.setHours(twoHoursBeforeStart.getHours() - 2);

        if (now >= twoHoursBeforeStart) {
          return res.status(400).json({
            message: "Cancellation is not allowed less than 2 hours before class start."
          });
        }
      }
    }

    await Reservations.destroy({
      where: { ReservationID: req.params.id }
    });

    return res.send({ message: "Rezerwacja usunięta." });

  } catch (err) {
    console.error("Błąd przy usuwaniu rezerwacji:", err);
    res.status(500).send({ message: "Błąd serwera" });
  }
};

/**
 * GET raw reservations (without includes) - for admin/debug purposes
 */
const getRawReservations = async (req, res) => {
  try {
    const reservations = await Reservations.findAll();
    return res.json(reservations);
  } catch (err) {
    console.error("Błąd przy pobieraniu surowych rezerwacji:", err);
    res.status(500).send({ message: "Błąd serwera" });
  }
};

/**
 * GET all reservations (both class and room reservations combined)
 */
const getAllReservations = async (req, res) => {
  try {
    const role = req.headers["auth-role"];
    const userId = req.user.id;
    
    // Build WHERE clauses based on user role
    let classWhereClause = "r.DeletedAt IS NULL";
    let roomWhereClause = "rr.DeletedAt IS NULL";
    
    if (role === "regular") {
      classWhereClause += ` AND r.UserID = ${userId}`;
      roomWhereClause += ` AND rr.CreatedByUserID = ${userId}`;
    }

    // UNION query to combine both types of reservations
    const query = `
      SELECT 
        'class' as reservation_type,
        r.ReservationID as id,
        r.UserID,
        r.Status,
        r.CreatedAt,
        r.UpdatedAt,
        u.Username as user_name,
        u.Email as user_email,
        fc.Title as class_title,
        fc.StartTime as class_start,
        fc.EndTime as class_end,
        rm.RoomName as room_name,
        rm.Location as room_location,
        NULL as room_purpose,
        NULL as reservation_start,
        NULL as reservation_end
      FROM reservations r
      LEFT JOIN users u ON r.UserID = u.UserID AND u.DeletedAt IS NULL
      LEFT JOIN fitness_classes fc ON r.ClassID = fc.ClassID AND fc.DeletedAt IS NULL
      LEFT JOIN rooms rm ON fc.RoomID = rm.RoomID AND rm.DeletedAt IS NULL
      WHERE ${classWhereClause}
      
      UNION ALL
      
      SELECT 
        'room' as reservation_type,
        rr.RoomReservationID as id,
        rr.CreatedByUserID as UserID,
        rr.Status,
        rr.CreatedAt,
        rr.UpdatedAt,
        u2.Username as user_name,
        u2.Email as user_email,
        rr.Title as class_title,
        rr.StartTime as class_start,
        rr.EndTime as class_end,
        rm2.RoomName as room_name,
        rm2.Location as room_location,
        rr.Title as room_purpose,
        rr.StartTime as reservation_start,
        rr.EndTime as reservation_end
      FROM room_reservations rr
      LEFT JOIN users u2 ON rr.CreatedByUserID = u2.UserID AND u2.DeletedAt IS NULL
      LEFT JOIN rooms rm2 ON rr.RoomID = rm2.RoomID AND rm2.DeletedAt IS NULL
      WHERE ${roomWhereClause}
      
      ORDER BY CreatedAt DESC
    `;

    const [results] = await sequelize.query(query);
    
    // Transform results to match frontend expectations
    const transformedResults = results.map(row => ({
      ReservationID: row.id,
      UserID: row.UserID,
      Status: row.Status,
      CreatedAt: row.CreatedAt,
      UpdatedAt: row.UpdatedAt,
      reservation_type: row.reservation_type,
      user: {
        Username: row.user_name,
        Email: row.user_email
      },
      fitness_class: row.reservation_type === 'class' ? {
        Title: row.class_title,
        StartTime: row.class_start,
        EndTime: row.class_end,
        room: {
          RoomName: row.room_name,
          Location: row.room_location
        }
      } : null,
      room_reservation: row.reservation_type === 'room' ? {
        Title: row.room_purpose,
        StartTime: row.reservation_start,
        EndTime: row.reservation_end,
        room: {
          RoomName: row.room_name,
          Location: row.room_location
        }
      } : null,
      // Unified fields for easier frontend rendering
      title: row.class_title,
      room_name: row.room_name,
      room_location: row.room_location
    }));

    return res.json(transformedResults);
  } catch (err) {
    console.error("Błąd przy pobieraniu wszystkich rezerwacji:", err);
    res.status(500).send({ message: "Błąd serwera" });
  }
};

module.exports = {
  getRawReservations,
  getReservations,
  getAllReservations,
  getReservationById,
  createReservation,
  updateReservation,
  deleteReservation
};
