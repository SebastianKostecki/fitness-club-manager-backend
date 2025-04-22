const { response } = require("express");
const Rooms = require("../models/Rooms");


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
        const { RoomName, Capacity,  Location } = req.body;
        const updateRoom = await Rooms.update({ RoomName, Capacity,  Location }, {
            where: { RoomID: req.params.id }
        });
        if (updateRoom[0] > 0) {
            return res.send({ message: "Sala zaktualizowana." });
        } else {
            return res.status(404).send({ message: "Nie znaleziono sali." });
        }
    } catch (err) {
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

module.exports = {
    getRooms,
    getRoombyId,
    createRoom,
    updateRoom,
    deleteRoom
};
