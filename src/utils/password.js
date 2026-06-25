const bcrypt = require("bcryptjs");

// Hash user password with 10 salt rounds
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

// Compare raw password against stored hash
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = {
  hashPassword,
  comparePassword,
};
