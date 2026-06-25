const { drizzle } = require("drizzle-orm/node-postgres");
const { Pool } = require("pg");
const schema = require("./schema");
require("dotenv").config();

// Fail fast if DATABASE_URL is missing
if (!process.env.DATABASE_URL) {
  console.error("CRITICAL: DATABASE_URL is not set in environment!");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// pg Pool will handle scaling connections automatically
const db = drizzle(pool, { schema });

module.exports = {
  db,
  pool,
};
