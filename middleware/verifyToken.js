const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-prod';

module.exports = function verify(req, res, next) {
  const cookieToken = req.cookies?.token;

  const authHeader = req.headers.authorization;
  const bearerToken =
    authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

  const token = cookieToken || bearerToken;
  if (!token) return res.status(401).json({ message: 'Access Denied' });

  try {
    const payload = jwt.verify(token, JWT_SECRET); // { id, role, iat, exp }
    req.user = {
      id: payload.id,
      Role: payload.role,
      UserID: payload.id,
      ...payload,
    };
    next();
  } catch (_e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
