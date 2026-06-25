const { pgTable, uuid, varchar, timestamp, pgEnum } = require("drizzle-orm/pg-core");

// Define role enum: EMP (Employee), RM (Reporting Manager), APE (Accounts Payable Executive), CFO (Chief Financial Officer)
const roleEnum = pgEnum("user_role", ["EMP", "RM", "APE", "CFO"]);

const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: roleEnum("role").default("EMP").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

module.exports = {
  roleEnum,
  users,
};
