const Joi = require("joi");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Users = require("../models/Users");

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-prod'; // ustawione na Render

// ===== Schematy walidacji =====
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

const loginSchema = Joi.object({
  email: Joi.string().min(6).required().email(),
  password: Joi.string().required(),
});

// ===== Rejestracja =====
async function registerUser(req, res) {
  const { error } = registerSchema.validate(req.body);
  if (error) return res.status(400).send(error);

  const emailExist = await Users.findOne({ where: { email: req.body.email } });
  if (emailExist) return res.status(400).send({ message: "Podany adres email jest już w użyciu" });

  const usernameExist = await Users.findOne({ where: { Username: req.body.username } });
  if (usernameExist) return res.status(400).send({ message: "Podana nazwa użytkownika jest już w użyciu" });

  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(req.body.password, salt);

  try {
    await Users.create({
      Username: req.body.username,
      Email: req.body.email,
      Password: hashPassword,
      Role: "regular",
    });
    res.json({ message: "User Registered" });
  } catch (err) {
    console.error("Registration error:", err);
    if (err.name === 'SequelizeUniqueConstraintError' && err.errors?.length) {
      const field = err.errors[0].path;
      if (field === 'Username') return res.status(400).send({ message: "Podana nazwa użytkownika jest już w użyciu" });
      if (field === 'Email') return res.status(400).send({ message: "Podany adres email jest już w użyciu" });
    }
    res.status(500).send({ message: "Wystąpił błąd podczas rejestracji. Spróbuj ponownie." });
  }
}

// ===== Logowanie (ustawia httpOnly cookie z JWT) =====
async function loginUser(req, res) {
  const { error } = loginSchema.validate(req.body);
  if (error) return res.status(400).send(error);

  const user = await Users.findOne({ where: { email: req.body.email } });
  if (!user) return res.status(400).send({ message: "Nie znaleziono adresu email" });

  const validPass = await bcrypt.compare(req.body.password, user.Password);
  if (!validPass) return res.status(400).send({ message: "Niepoprawne hasło" });

  const token = jwt.sign({ id: user.UserID, role: user.Role }, JWT_SECRET, { expiresIn: '7d' });

  res.cookie('token', token, {
    httpOnly: true,
    secure: true,     // Render jest HTTPS
    sameSite: 'none', // konieczne dla GH Pages -> Render
    path: '/',
    maxAge: 7 * 24 * 3600 * 1000,
  });

  return res.json({
    ok: true,
    jwt: token,
    role: user.Role,
    user: { id: user.UserID, username: user.Username, email: user.Email },
  });
}

// ===== Wylogowanie (czyści cookie) =====
function logoutUser(_req, res) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
  });
  res.json({ ok: true });
}

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
};
