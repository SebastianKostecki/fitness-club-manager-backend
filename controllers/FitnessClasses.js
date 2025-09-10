const { response } = require("express");
const { FitnessClasses, Users, Rooms } = require("../models");

const getFitnessClasses = async (req, res) => {
    try {
        const role = req.headers["auth-role"]
        let classes
        if(role === "regular"){
            classes = await FitnessClasses.findAll({
                where: {UserID: req.user.id}, //zaweza rekordy po id uzytkownika
                include: [
                    { model: Users, as: "trainer", attributes: ["UserID", "Username"] },
                    { model: Rooms, as: "room", attributes: ["RoomID", "RoomName"] }
                ]
            });
        } else {
            classes = await FitnessClasses.findAll({
                include: [
                    { model: Users, as: "trainer", attributes: ["UserID", "Username"] },
                    { model: Rooms, as: "room", attributes: ["RoomID", "RoomName"] }
                ]
            });
        }
        return res.send(classes);
    } catch (err) {
        res.status(500).send({ message: "Błąd serwera" });
    }
};

const getFitnessClassById = async (req, res) => {
    try {
        const fitnessClass = await FitnessClasses.findOne({
            where: { ClassID: req.params.id },
            include: [
                { model: Users, as: "trainer", attributes: ["UserID", "Username"] },
                { model: Rooms, as: "room", attributes: ["RoomID", "RoomName"] }
            ]
        });
        return res.send(fitnessClass);
    } catch (err) {
        res.status(500).send({ message: "Błąd serwera" });
    }
};

const createFitnessClass = async (req, res) => {
    try {
        const { TrainerID, RoomID, Title, StartTime, EndTime, Capacity, Status } = req.body;
        const newClass = await FitnessClasses.create({
            TrainerID,
            RoomID,
            Title,
            StartTime,
            EndTime,
            Capacity,
            Status
        });
        return res.status(201).send(newClass);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Błąd serwera" });
    }
};

const updateFitnessClass = async (req, res) => {
    try {
        const { TrainerID, RoomID, Title, StartTime, EndTime, Capacity, Status } = req.body;
        const fitnessClass = await FitnessClasses.findByPk(req.params.id);
        const userRole = req.headers['auth-role'] || req.user?.Role;
        const userId = req.user?.UserID || req.user?.id;

        if (!fitnessClass) {
            return res.status(404).send({ message: "Nie znaleziono zajęć." });
        }

        // Trainer can only edit their own classes, admin can edit any
        if (userRole === 'trainer' && fitnessClass.TrainerID != userId) {
            return res.status(403).json({ 
                message: "Access denied. Trainers can only edit their own classes." 
            });
        }

        await fitnessClass.update({
            TrainerID,
            RoomID,
            Title,
            StartTime,
            EndTime,
            Capacity,
            Status
        });

        return res.send({ message: "Zajęcia zaktualizowane." });
    } catch (err) {
        console.error("Błąd przy aktualizacji zajęć:", err);
        res.status(500).send({ message: "Błąd serwera" });
    }
};

const deleteFitnessClass = async (req, res) => {
    try {
        const fitnessClass = await FitnessClasses.findByPk(req.params.id);
        const userRole = req.headers['auth-role'] || req.user?.Role;
        const userId = req.user?.UserID || req.user?.id;

        if (!fitnessClass) {
            return res.status(404).send({ message: "Nie znaleziono zajęć." });
        }

        // Trainer can only delete their own classes, admin can delete any
        if (userRole === 'trainer' && fitnessClass.TrainerID != userId) {
            return res.status(403).json({ 
                message: "Access denied. Trainers can only delete their own classes." 
            });
        }

        const deleted = await FitnessClasses.destroy({
            where: { ClassID: req.params.id }
        });

        if (deleted) {
            return res.send({ message: "Zajęcia usunięte." });
        } else {
            return res.status(404).send({ message: "Nie znaleziono zajęć." });
        }
    } catch (err) {
        res.status(500).send({ message: "Błąd serwera" });
    }
};

module.exports = {
    getFitnessClasses,
    getFitnessClassById,
    createFitnessClass,
    updateFitnessClass,
    deleteFitnessClass
};
