const express = require("express");

const users = require("../controllers/Users.js");
const auth = require("../controllers/Auth.js");
const verify = require("./verifyToken");
const rooms=require("../controllers/Rooms.js")


const router = express.Router();

//Users
router.get("/users", verify, users.getUsers);
router.get("/users/:id", verify, users.getUserById);
router.post("/users", verify, users.createUser);
router.put("/users/:id", verify, users.updateUser);
router.delete("/users/:id", verify, users.deleteUser);

//Rooms
router.get("/rooms", verify, rooms.getRooms);
router.get("/rooms/:id", verify, rooms.getRoombyId);
router.post("/rooms", verify, rooms.createRoom);
router.put("/rooms/:id", verify, rooms.updateRoom);
router.delete("/rooms/:id", verify, rooms.deleteRoom);



//Auth
router.post("/register", auth.registerUser);
router.post("/login", auth.loginUser);



module.exports = router;
