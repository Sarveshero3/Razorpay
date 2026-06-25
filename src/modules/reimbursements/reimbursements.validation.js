const { z } = require("zod");

// Validator for raising a reimbursement: requires title, description, and positive numeric amount
const createReimbursementSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().min(1, "Description is required"),
  // Why: Spec explicitly requires amount to be a positive number, validating via Zod
  amount: z.number().positive("Amount must be a positive number"),
});

// Validator for approving/rejecting a reimbursement
const patchReimbursementSchema = z.object({
  userId: z.string().uuid("userId must be a valid UUID"),
  status: z.enum(["APPROVED", "REJECTED"], {
    errorMap: () => ({ message: "Status must be APPROVED or REJECTED" }),
  }),
});

module.exports = {
  createReimbursementSchema,
  patchReimbursementSchema,
};
