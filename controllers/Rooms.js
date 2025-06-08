const { response } = require("express");
const { Rooms, Equipment, RoomEquipment } = require("../models");


const getRooms = async (req, res) => {
    try {
        const rooms = await Rooms.findAll();
        return res.send(rooms);
    } catch (err) {
        res.status(500).send({
            message: "Błąd serwera",
        });
    }
};


const getRoombyId = async (req, res) => {
    try {
        const room = await Rooms.findOne({
            where: { 
                RoomID: req.params.id 
            }
        });
        return res.send(room);
    } catch (err) {
        console.log(err)
        res.status(500).send({
            message: "Błąd serwera",
        });
    }
};

const createRoom = async (req, res) => {
    try {
        const { RoomName, Capacity,  Location } = req.body;
        const newRoom = await Rooms.create({ RoomName, Capacity,  Location });
        return res.status(201).send(newRoom);
    } catch (err) {
        console.log(err)
        res.status(500).send({
            message: "Błąd serwera",
        });
    }
};

const updateRoom = async (req, res) => {
    try {
        const { RoomName, Capacity, Location } = req.body;

        const room = await Rooms.findByPk(req.params.id);
        if (!room) {
            return res.status(404).send({ message: "Nie znaleziono sali." });
        }
        await room.update({ RoomName, Capacity, Location });
        return res.send({ message: "Sala zaktualizowana." });
        
    } catch (err) {
        console.error('Błąd przy aktualizacji sali:', err);
        res.status(500).send({
            message: "Błąd serwera",
        });
    }
};

const deleteRoom = async (req, res) => {
    try {
        const deleted = await Rooms.destroy({
            where: { RoomID: req.params.id }
        });
        if (deleted) {
            return res.send({ message: "Sala usunięta." });
        } else {
            return res.status(404).send({ message: "Nie znaleziono sali." });
        }
    } catch (err) {
        res.status(500).send({
            message: "Błąd serwera",
        });
    }
};



const getRoomDetails = async (req, res) => {
  try {
    const roomId = req.params.id;

    const room = await Rooms.findOne({
      where: { RoomID: roomId },
      raw: true,
    });

    if (!room) {
      return res.status(404).send({ message: "Sala nie istnieje" });
    }

    const equipment = await RoomEquipment.findAll({
      where: { RoomID: roomId },
      include: [{
        model: Equipment,
        as: "equipment",
        attributes: ["EquipmentName", "Description"],
      }],
    });

    return res.send({
      room,
      equipment: equipment.map((item) => ({
        EquipmentName: item.equipment.EquipmentName,
        Description: item.equipment.Description,
        Quantity: item.Quantity
      })),
    });
  } catch (err) {
    console.error("Błąd przy pobieraniu szczegółów sali:", err);
    res.status(500).send({ message: "Błąd serwera" });
  }
};

module.exports = {
    getRooms,
    getRoombyId,
    createRoom,
    updateRoom,
    deleteRoom,
    getRoomDetails
};
