/* models/index.js */
const sequelize = require("../config/sequelize");

const Equipment       = require("./Equipment");
const RoomEquipment   = require("./RoomEquipment");
const Rooms           = require("./Rooms");
const Reservations    = require("./Reservations");
const Users           = require("./Users");
const FitnessClasses  = require("./FitnessClasses");

/* ---------- Sprzęt ↔︎ RoomEquipment ---------- */
Equipment.hasMany(RoomEquipment, {
  foreignKey: "EquipmentID",
});
RoomEquipment.belongsTo(Equipment, {
  foreignKey: "EquipmentID",
  as: "equipment",
});

/* ---------- Rooms ↔︎ RoomEquipment ---------- */
Rooms.hasMany(RoomEquipment, {
  foreignKey: "RoomID",
  onDelete : "CASCADE",
});
RoomEquipment.belongsTo(Rooms, {
  foreignKey: "RoomID",
  onDelete : "CASCADE",
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

/* ---------- Eksport modeli ---------- */
module.exports = {
  sequelize,
  Equipment,
  RoomEquipment,
  Rooms,
  Reservations,
  Users,
  FitnessClasses,
};