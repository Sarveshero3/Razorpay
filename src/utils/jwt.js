const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

// Fail fast on startup if JWT_SECRET is missing
if (!JWT_SECRET) {
  console.error("CRITICAL: JWT_SECRET environment variable is missing!");
  process.exit(1);
}

// Generate token containing userId and role
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
}

// Verify token validity and return payload or null if invalid/expired
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

module.exports = {
  signToken,
  verifyToken,
};
