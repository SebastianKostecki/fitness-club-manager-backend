const Joi = require("joi");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Users = require("../models/Users");

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-prod'; // USTAW na Render!

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

// --- registerUser bez zmian (zostaw Twój kod) ---

const loginSchema = Joi.object({
  email: Joi.string().min(6).required().email(),
  password: Joi.string().required(),
});

// LOGIN -> ustawia httpOnly cookie z JWT
const loginUser = async (req, res) => {
  const { error } = loginSchema.validate(req.body);
  if (error) return res.status(400).send(error);

  const user = await Users.findOne({ where: { email: req.body.email } });
  if (!user) {
    return res.status(400).send({ message: "Nie znaleziono adresu email" });
  }

  const validPass = await bcrypt.compare(req.body.password, user.Password);
  if (!validPass) {
    return res.status(400).send({ message: "Niepoprawne hasło" });
  }

  // JWT z ważnością, sekretem z ENV
  const token = jwt.sign({ id: user.UserID, role: user.Role }, JWT_SECRET, { expiresIn: '7d' });

  // COOKIE cross-site dla GH Pages -> Render
  res.cookie('token', token, {
    httpOnly: true,
    secure: true,       // Render działa po HTTPS; lokalnie patrz uwaga niżej
    sameSite: 'none',   // konieczne dla połączenia z innej domeny
    path: '/',
    maxAge: 7 * 24 * 3600 * 1000,
  });

  return res.json({
    ok: true,
    role: user.Role,
    user: { id: user.UserID, username: user.Username, email: user.Email },
  });
};

// LOGOUT -> czyści cookie
const logoutUser = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    path: '/',
  });
  res.json({ ok: true });
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
};
