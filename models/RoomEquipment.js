const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const RoomEquipment = sequelize.define("room_equipment", {
  RoomID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  EquipmentID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  Quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: "room_equipment",
  timestamps: false
});



module.exports = RoomEquipment;
