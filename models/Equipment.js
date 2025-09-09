const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const Equipment = sequelize.define("equipment", {
  EquipmentID: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  EquipmentName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  Description: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  tableName: "equipment",
  timestamps: true,
  paranoid: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt',
  deletedAt: 'DeletedAt'
});

module.exports = Equipment;
