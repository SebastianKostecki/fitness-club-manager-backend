/* models/index.js */
const sequelize = require("../config/sequelize");

const Equipment       = require("./Equipment");
const RoomEquipment   = require("./RoomEquipment");
const Rooms           = require("./Rooms");
const Reservations    = require("./Reservations");
const Users           = require("./Users");
const FitnessClasses  = require("./FitnessClasses");
const RoomReservations = require("./RoomReservations");
const EmailReminders  = require("./EmailReminders");

/* ---------- Sprzęt ↔︎ RoomEquipment ---------- */
Equipment.hasMany(RoomEquipment, {
  foreignKey: "EquipmentID",
  constraints: false
});
RoomEquipment.belongsTo(Equipment, {
  foreignKey: "EquipmentID",
  as: "equipment",
  constraints: false
});

/* ---------- Rooms ↔︎ RoomEquipment ---------- */
Rooms.hasMany(RoomEquipment, {
  foreignKey: "RoomID",
  constraints: false
});
RoomEquipment.belongsTo(Rooms, {
  foreignKey: "RoomID",
  constraints: false
});

/* ---------- FitnessClasses ↔︎ Users (trener) ---------- */
FitnessClasses.belongsTo(Users, {
  foreignKey: "TrainerID",
  as        : "trainer",
});
Users.hasMany(FitnessClasses, {
  foreignKey: "TrainerID",
});

/* ---------- FitnessClasses ↔︎ Rooms ---------- */
FitnessClasses.belongsTo(Rooms, {
  foreignKey: "RoomID",
  as        : "room",
});
Rooms.hasMany(FitnessClasses, {
  foreignKey: "RoomID",
  as        : "fitness_classes",
});

/* ---------- Reservations ↔︎ Users ---------- */
Reservations.belongsTo(Users, {
  foreignKey: "UserID",
});
Users.hasMany(Reservations, {
  foreignKey: "UserID",
  onDelete : "CASCADE",
});

/* ---------- Reservations ↔︎ FitnessClasses ---------- */
Reservations.belongsTo(FitnessClasses, {
  foreignKey: "ClassID",
  as        : "fitness_class",
});
FitnessClasses.hasMany(Reservations, {
  foreignKey: "ClassID",
  as        : "reservations",
  onDelete : "CASCADE",
});

/* ---------- RoomReservations ↔︎ Users ---------- */
RoomReservations.belongsTo(Users, {
  foreignKey: "CreatedByUserID",
  as: "user"
});
Users.hasMany(RoomReservations, {
  foreignKey: "CreatedByUserID",
  as: "room_reservations"
});

/* ---------- RoomReservations ↔︎ Rooms ---------- */
RoomReservations.belongsTo(Rooms, {
  foreignKey: "RoomID",
  as: "room"
});
Rooms.hasMany(RoomReservations, {
  foreignKey: "RoomID",
  as: "room_reservations"
});

/* ---------- EmailReminders associations ---------- */
EmailReminders.belongsTo(Reservations, {
  foreignKey: "ReservationID",
  as: "reservation"
});
Reservations.hasMany(EmailReminders, {
  foreignKey: "ReservationID",
  as: "email_reminders"
});

EmailReminders.belongsTo(Users, {
  foreignKey: "UserID",
  as: "user"
});
Users.hasMany(EmailReminders, {
  foreignKey: "UserID",
  as: "email_reminders"
});

EmailReminders.belongsTo(FitnessClasses, {
  foreignKey: "ClassID",
  as: "fitness_class"
});
FitnessClasses.hasMany(EmailReminders, {
  foreignKey: "ClassID",
  as: "email_reminders"
});

/* ---------- EmailReminders ↔︎ RoomReservations ---------- */
EmailReminders.belongsTo(RoomReservations, {
  foreignKey: "RoomReservationID",
  as: "room_reservation"
});
RoomReservations.hasMany(EmailReminders, {
  foreignKey: "RoomReservationID",
  as: "email_reminders"
});

/* ---------- Eksport modeli ---------- */
module.exports = {
  sequelize,
  Equipment,
  RoomEquipment,
  Rooms,
  Reservations,
  Users,
  FitnessClasses,
  RoomReservations,
  EmailReminders,
};