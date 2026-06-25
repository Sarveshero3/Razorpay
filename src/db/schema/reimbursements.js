const { pgTable, uuid, varchar, text, doublePrecision, boolean, timestamp, pgEnum } = require("drizzle-orm/pg-core");
const { users } = require("./users");

const statusEnum = pgEnum("reimbursement_status", ["PENDING", "REJECTED", "APPROVED"]);

const reimbursements = pgTable("reimbursements", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  amount: doublePrecision("amount").notNull(),
  status: statusEnum("status").default("PENDING").notNull(),
  rmApproved: boolean("rm_approved").default(false).notNull(),
  apeApproved: boolean("ape_approved").default(false).notNull(),
  approvedByRmId: uuid("approved_by_rm_id")
    .references(() => users.id, { onDelete: "set null" }),
  approvedByApeId: uuid("approved_by_ape_id")
    .references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

module.exports = {
  statusEnum,
  reimbursements,
};
