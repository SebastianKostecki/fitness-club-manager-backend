const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const RoomEquipment = sequelize.define("room_equipment", {
  RoomID: {
    type: DataTypes.BIGINT,
    allowNull: false,
    primaryKey: true,
    references: {
      model: 'rooms',
      key: 'RoomID'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  EquipmentID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    references: {
      model: 'equipment',
      key: 'EquipmentID'
    },
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE'
  },
  Quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  }
}, {
  tableName: "room_equipment",
  timestamps: true,
  paranoid: true,
  createdAt: 'CreatedAt',
  updatedAt: 'UpdatedAt',
  deletedAt: 'DeletedAt',
  indexes: [
    {
      fields: ['RoomID', 'EquipmentID'],
      name: 'idx_room_equipment_composite'
    }
  ]
});

module.exports = RoomEquipment;
