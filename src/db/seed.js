const { db, pool } = require("./db");
const { users } = require("./schema");
const bcrypt = require("bcryptjs");

async function seed() {
  console.log("Seeding CFO root account...");
  try {
    const email = "cfo@org.com";
    const password = "CFO#ORG@April2026";
    
    // Hash the password the same way normal users' passwords are hashed (salt rounds = 10)
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Insert with conflict handling to make the script fully idempotent
    await db.insert(users)
      .values({
        name: "Chief Financial Officer",
        email: email,
        passwordHash: passwordHash,
        role: "CFO",
      })
      .onConflictDoNothing({ target: users.email });
      
    console.log("CFO root account seeded successfully or already exists!");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  } finally {
    // Close the pool connection cleanly
    await pool.end();
  }
}

seed();
