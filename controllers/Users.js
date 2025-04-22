const { response } = require("express");
const Users = require("../models/Users");

// const getUsers = async (req, res) => {
//     try {
//         const users = await Users.findAll({
//             where: {UserID: req.user.id}
//         });
//         return res.send(users);
//     } catch (err) {
//         res.status(500).send({
//             message: "Błąd serwera",
//         });
//     }
// };

const getUsers = async (req, res) => {
    try {
        let whereClause = {};
        if (req.user) {
            whereClause.UserID = req.user.id;
        }

        const users = await Users.findAll({where: whereClause});
        return res.send(users);
        // res.status(500).send({
        //     message: "Błąd serwera",
        // });
    } catch (err) {
        res.status(500).send({
            message: "Błąd serwera",
        });
    }
};


const getUserById = async (req, res) => {
    try {
        const user = await Users.findOne({
            where: { 
                UserID: req.user.id,
                UserID: req.params.id 
            }
        });
        return res.send(user);
    } catch (err) {
        res.status(500).send({
            message: "Błąd serwera",
        });
    }
};

const createUser = async (req, res) => {
    try {
        const { Username, Password, Email, Role } = req.body;
        const newUser = await Users.create({ Username, Password, Email, Role });
        return res.status(201).send(newUser);
    } catch (err) {
        res.status(500).send({
            message: "Błąd serwera",
        });
    }
};

const updateUser = async (req, res) => {
    try {
        const { Username, Password, Email, Role } = req.body;
        const updatedUser = await Users.update({ Username, Password, Email, Role }, {
            where: { UserID: req.params.id }
        });
        if (updatedUser[0] > 0) {
            return res.send({ message: "Użytkownik zaktualizowany." });
        } else {
            return res.status(404).send({ message: "Nie znaleziono użytkownika." });
        }
    } catch (err) {
        res.status(500).send({
            message: "Błąd serwera",
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        const deleted = await Users.destroy({
            where: { UserID: req.params.id }
        });
        if (deleted) {
            return res.send({ message: "Użytkownik usunięty." });
        } else {
            return res.status(404).send({ message: "Nie znaleziono użytkownika." });
        }
    } catch (err) {
        res.status(500).send({
            message: "Błąd serwera",
        });
    }
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
};
