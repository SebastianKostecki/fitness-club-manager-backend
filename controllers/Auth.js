// controllers/Auth.js
const Joi = require("joi");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Users = require("../models/Users");

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-prod";

/* ===== Schematy walidacji ===== */
const registerSchema = Joi.object({
  username: Joi.string().min(3).required(),
  email: Joi.string().min(6).required().email(),
  password: Joi.string()
    .min(8)
    .max(32)
    .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*]).+$"))
    .required()
    .messages({
      "string.pattern.base":
        "Hasło musi zawierać małą i wielką literę, cyfrę oraz znak specjalny",
      "string.min": "Hasło musi mieć co najmniej 8 znaków",
      "string.max": "Hasło może mieć maksymalnie 32 znaki",
    }),
});

const loginSchema = Joi.object({
  email: Joi.string().min(6).required().email(),
  password: Joi.string().required(),
});

/* ===== Rejestracja ===== */
async function registerUser(req, res) {
  const { error } = registerSchema.validate(req.body);
  if (error) return res.status(400).send(error);

  // czy email zajęty?
  const emailExist = await Users.findOne({ where: { email: req.body.email } });
  if (emailExist)
    return res
      .status(400)
      .send({ message: "Podany adres email jest już w użyciu" });

  // czy username zajęty?
  const usernameExist = await Users.findOne({
    where: { Username: req.body.username },
  });
  if (usernameExist)
    return res
      .status(400)
      .send({ message: "Podana nazwa użytkownika jest już w użyciu" });

  // hasz hasła
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(req.body.password, salt);

  // tworzenie użytkownika
  try {
    const user = await Users.create({
      Username: req.body.username,
      Email: req.body.email,
      Password: hashPassword,
      Role: "regular",
    });

    // (opcjonalnie) automatyczne zalogowanie po rejestracji
    const token = jwt.sign(
      { id: user.UserID, role: user.Role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 7 * 24 * 3600 * 1000,
    });

    return res.json({
      ok: true,
      message: "User Registered",
      user: { id: user.UserID, username: user.Username, email: user.Email },
    });
  } catch (err) {
    console.error("Registration error:", err);

    if (err.name === "SequelizeUniqueConstraintError" && err.errors?.length) {
      const field = err.errors[0].path;
      if (field === "Username")
        return res
          .status(400)
          .send({ message: "Podana nazwa użytkownika jest już w użyciu" });
      if (field === "Email")
        return res
          .status(400)
          .send({ message: "Podany adres email jest już w użyciu" });
    }
    return res
      .status(500)
      .send({ message: "Wystąpił błąd podczas rejestracji. Spróbuj ponownie." });
  }
}

/* ===== Logowanie ===== */
async function loginUser(req, res) {
  const { error } = loginSchema.validate(req.body);
  if (error) return res.status(400).send(error);

  const user = await Users.findOne({ where: { email: req.body.email } });
  if (!user) return res.status(400).send({ message: "Nie znaleziono adresu email" });

  const validPass = await bcrypt.compare(req.body.password, user.Password);
  if (!validPass) return res.status(400).send({ message: "Niepoprawne hasło" });

  const token = jwt.sign(
    { id: user.UserID, role: user.Role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 7 * 24 * 3600 * 1000,
  });

  return res.json({
    ok: true,
    role: user.Role,
    user: { id: user.UserID, username: user.Username, email: user.Email },
  });
}

/* ===== Logout ===== */
function logoutUser(_req, res) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });
  res.json({ ok: true });
}

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
};
