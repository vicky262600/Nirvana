import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export function signJWT(user) {
  return jwt.sign(
    { id: user._id, isAdmin: user.isAdmin },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyJWT(token) {
  return jwt.verify(token, JWT_SECRET);
}
