const { z } = require("zod");

// Validator for assigning/deleting employee relationships
// Supports either empUserId or userId (fallback) as the employee ID, and rmUserId as the manager ID
const assignEmployeeSchema = z.object({
  empUserId: z.string().uuid("empUserId must be a valid UUID").optional(),
  userId: z.string().uuid("userId must be a valid UUID").optional(),
  rmUserId: z.string().uuid("rmUserId must be a valid UUID"),
}).refine((data) => data.empUserId || data.userId, {
  message: "Either empUserId or userId must be provided as the employee ID",
  path: ["empUserId"],
});

module.exports = {
  assignEmployeeSchema,
};
