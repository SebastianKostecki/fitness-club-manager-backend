const {response} = require("express");
const { Rooms, Equipment, RoomEquipment } = require("../models");

const getEquipment = async (req, res) => {
    try {
        console.log('🔍 Equipment.findAll() - starting...');
        const equipment = await Equipment.findAll();
        console.log('✅ Equipment.findAll() - success, found:', equipment.length, 'items');
        return res.send(equipment);
    } catch (err) {
        console.error('❌ Equipment.findAll() - ERROR:', err.message);
        console.error('Full error:', err);
        res.status(500).send({
            message: "Błąd serwera: " + err.message,
        });
    }
}

const getEquipmentById = async (req, res) => {
    try {
        const equipment = await Equipment.findOne({
            where: {  
                EquipmentID: req.params.id
            }
        });
        return res.send(equipment);
    } catch (err) {
        res.status(500).send({
            message: "Błąd serwera"
        })
    }
}

const createEquipment = async(req, res) => {
    try{
        const { EquipmentName, Description} = req.body;
        const newEquipment = await Equipment.create({EquipmentName, Description});
        return res.status(201).send(newEquipment)
    } catch (err) {
        console.log(err)
        res.status(500).send({
            message: "Błąd serwera",
        });
    }
}

const updateEquipment = async(req, res) => {
    try {
        const { EquipmentName, Description} = req.body;
        const equipment = await Equipment.findByPk(req.params.id);
        if (!equipment) {
            return res.status(404).send({message:"Nie znaleziono sprzętu."});
        }
        await equipment.update({EquipmentName, Description});
        return res.send({message: "Sprzęt zaktualizowany."});
    }catch (err){
        console.error('Błąd przy aktualizacji sprzętu', err);
        res.status(500).send({
            message: "Błąd serwera",
        });
    }
}

const deleteEquipment = async (req, res) => {
    try {
        const deleted = await Equipment.destroy({
            where: { EquipmentID: req.params.id}
        });
        if (deleted) {
            return res.send({ message: "Sprzęt usunięty."});
        } else {
            return res.status(404).send({ message: "Nie znaleziono sprzętu."})
        }
    } catch (err) {
        res.status(500).send({
            message: "Błąd serwera",
        });
    }
}

module.exports = {
    getEquipment,
    createEquipment,
    getEquipmentById,
    updateEquipment,
    deleteEquipment
}