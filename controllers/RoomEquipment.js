const {response} = require("express");
const { Rooms, Equipment, RoomEquipment } = require("../models");

const getRoomEquipment = async (req, res) => {
    try {
        const roomEquipment = await RoomEquipment.findAll();
        return res.send(roomEquipment);
    } catch (err) {
        res.status(500).send({
            message: "Błąd serwera",
        })
    }
};


const createRoomEquipment = async (req, res) => {
  try {
    const { RoomID, EquipmentID, Quantity } = req.body;

    const newAssignment = await RoomEquipment.create({
      RoomID,
      EquipmentID,
      Quantity,
    });

    return res.status(201).send(newAssignment);
  } catch (err) {
    console.error("Błąd przy przypisywaniu sprzętu do sali:", err);
    res.status(500).send({
      message: "Błąd serwera",
    });
  }
};

const updateRoomEquipment = async (req, res) => {
  try {
    const { roomId, equipmentId } = req.params;
    const { Quantity } = req.body;

    const roomEquipment = await RoomEquipment.findOne({
      where: {
        RoomID: roomId,
        EquipmentID: equipmentId
      }
    });

    if (!roomEquipment) {
      return res.status(404).send({ message: "Nie znaleziono przypisanego sprzętu." });
    }

    await roomEquipment.update({ Quantity });
    return res.send({ message: "Ilość sprzętu zaktualizowana." });

  } catch (err) {
    console.error("Błąd przy aktualizacji sprzętu w sali:", err);
    res.status(500).send({ message: "Błąd serwera" });
  }
};

const deleteRoomEquipment = async (req, res) => {
  try {
    const { roomId, equipmentId } = req.params;

    const deleted = await RoomEquipment.destroy({
      where: {
        RoomID: roomId,
        EquipmentID: equipmentId
      }
    });

    if (deleted) {
      return res.send({ message: "Sprzęt usunięty z sali." });
    } else {
      return res.status(404).send({ message: "Nie znaleziono przypisania sprzętu do sali." });
    }
  } catch (err) {
    console.error("Błąd przy usuwaniu sprzętu z sali:", err);
    res.status(500).send({ message: "Błąd serwera" });
  }
};




module.exports = {
    getRoomEquipment,
    createRoomEquipment,
    updateRoomEquipment,
    deleteRoomEquipment
}