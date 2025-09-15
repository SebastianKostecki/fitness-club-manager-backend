const { Reservations, Users, FitnessClasses, Rooms } = require("../models");
const reminderService = require("../services/reminderService");

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
    // RserevationType - userReservation/trainerRerervation
    const newReservation = await Reservations.create({ UserID, Status, ClassID });
    
    // Auto-create email reminder for confirmed reservations
    if (Status === 'confirmed' || Status === 'pending') {
      try {
        await reminderService.createReminderForReservation(newReservation);
        console.log('✅ Email reminder created for reservation:', newReservation.ReservationID);
      } catch (reminderError) {
        console.error('❌ Failed to create email reminder:', reminderError.message);
        // Don't fail the reservation creation if reminder fails
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

    // Users can only delete their own reservations, admin/receptionist can delete any
    if (userRole !== 'admin' && userRole !== 'receptionist' && reservation.UserID != userId) {
      return res.status(403).json({ 
        message: "Access denied. You can only manage your own reservations." 
      });
    }

    const deleted = await Reservations.destroy({
      where: { ReservationID: req.params.id }
    });

    if (deleted) {
      return res.send({ message: "Rezerwacja usunięta." });
    } else {
      return res.status(404).send({ message: "Nie znaleziono rezerwacji." });
    }
  } catch (err) {
    res.status(500).send({ message: "Błąd serwera" });
  }
};

module.exports = {
  getReservations,
  getReservationById,
  createReservation,
  updateReservation,
  deleteReservation
};
