const { drizzle } = require("drizzle-orm/node-postgres");
const { Pool } = require("pg");
const schema = require("./schema");
require("dotenv").config();

let db;
let pool;

if (process.env.NODE_ENV === "test" || process.env.DB_MOCK === "true") {
  // Why: Avoid requiring a running PG server when running integration testing or in mock mode
  console.log("DB: Using in-memory mock database");
  const { createMockDb } = require("./db.mock");
  db = createMockDb();
  pool = {
    end: async () => {},
  };
} else {
  const { drizzle } = require("drizzle-orm/node-postgres");
  const { Pool } = require("pg");

  // Fail fast if DATABASE_URL is missing
  if (!process.env.DATABASE_URL) {
    console.error("CRITICAL: DATABASE_URL is not set in environment!");
    process.exit(1);
  }

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  // pg Pool will handle scaling connections automatically
  db = drizzle(pool, { schema });
}

module.exports = {
  db,
  pool,
};
