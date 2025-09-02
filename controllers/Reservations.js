const { Reservations, Users, FitnessClasses, Rooms } = require("../models");

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

    if (!reservation) {
      return res.status(404).send({ message: "Nie znaleziono rezerwacji." });
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
