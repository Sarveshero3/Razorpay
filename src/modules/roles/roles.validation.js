const { z } = require("zod");

const assignRoleSchema = z.object({
  userId: z.string().uuid("userId must be a valid UUID"),
  role: z.enum(["EMP", "RM", "APE", "CFO"], {
    errorMap: () => ({ message: "Role must be one of EMP, RM, APE, CFO" }),
  }),
});

module.exports = {
  assignRoleSchema,
};
