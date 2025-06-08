const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const Reservations = sequelize.define("reservations", {
    ReservationID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    UserID: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    Status: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    ClassID: {
        type: DataTypes.INTEGER,
        allowNull: true // Jeżeli bym chciał to mogę sprawić, by byly obslugiwane inne rezerwacje niż tylko na zajęcia
    }
}, {
    tableName: "reservations",
    timestamps: false
});

module.exports = Reservations;
