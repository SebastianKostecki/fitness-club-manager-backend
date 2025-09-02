const Joi = require("joi")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const Users = require("../models/Users")

const registerSchema = Joi.object({
    username: Joi.string().min(3).required(),
    email: Joi.string().min(6).required().email(),
    password: Joi.string()
  .min(8)
  .max(32)
  .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*]).+$'))
  .required()
  .messages({
    'string.pattern.base': 'Hasło musi zawierać małą i wielką literę, cyfrę oraz znak specjalny',
    'string.min': 'Hasło musi mieć co najmniej 8 znaków',
    'string.max': 'Hasło może mieć maksymalnie 32 znaki',
  }),
  });
  
  // register user
  const registerUser = async (req, res) => {
    // LETS VALIDATE THE DATA BEFORE WE A USER
    const { error } = registerSchema.validate(req.body);
    if (error) return res.status(400).send(error);
  
    // Checking if the user is already on database
    const emailExist = await Users.findOne({
      where: { email: req.body.email },
    });
  
    if (emailExist)
      return res.status(400).send({
        message: "Podany adres email jest już w użyciu",
      });
  
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(req.body.password, salt);
  
    // Create a new user
    const user = {
      Username: req.body.username,
      Email: req.body.email,
      Password: hashPassword,
      Role: "regular"
    };
    try {
      await Users.create(user);
      res.json({
        message: "User Registered",
      });
    } catch (err) {
      console.log(err);
    }
  };
  
  const loginSchema = Joi.object({
    email: Joi.string().min(6).required().email(),
    password: Joi.string().required(),
  });
  
  // login user
  const loginUser = async (req, res) => {
    // LETS VALIDATE THE DATA BEFORE WE A USER
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).send(error);
  
    // Checking if the email exists
    const user = await Users.findOne({ where: { email: req.body.email } });
    if (!user)
      return res.status(400).send({
        message: "Nie znaleziono adresu email",
      });
  
    // PASSWORD IS CORRECT
    const validPass = await bcrypt.compare(req.body.password, user.Password);
    if (!validPass)
      return res.status(400).send({
        message: "Niepoprawne hasło",
      });
  
    // Create and assign a token
    const token = jwt.sign({ id: user.UserID }, 'zsedcftgbhujmkol');
    return res.header("auth-token", token).send({
      jwt: token,
      role: user.Role,
    });
  };
  
  module.exports = {
    registerUser,
    loginUser,
  };