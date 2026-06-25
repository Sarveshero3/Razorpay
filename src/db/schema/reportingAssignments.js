const { pgTable, uuid } = require("drizzle-orm/pg-core");
const { users } = require("./users");

const reportingAssignments = pgTable("reporting_assignments", {
  empId: uuid("emp_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  rmId: uuid("rm_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

module.exports = {
  reportingAssignments,
};
