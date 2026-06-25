const { eq } = require("drizzle-orm");
const { db } = require("../../db/db");
const { users } = require("../../db/schema");

class OnboardingRepository {
  // Query DB to find a user by their unique email
  async findUserByEmail(email) {
    return db.query.users.findFirst({
      where: eq(users.email, email),
    });
  }

  // Insert user with hashed credentials and EMP role
  async createUser(userData) {
    const [newUser] = await db.insert(users)
      .values({
        name: userData.name,
        email: userData.email,
        passwordHash: userData.passwordHash,
        role: userData.role || "EMP",
      })
      .returning();
    return newUser;
  }
}

module.exports = new OnboardingRepository();
