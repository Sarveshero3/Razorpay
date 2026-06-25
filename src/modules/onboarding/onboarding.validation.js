const { z } = require("zod");

// Validator for registration: requires non-empty name, email ending in @org.com, and password >= 6 characters
const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Invalid email format").refine(
    (val) => val.endsWith("@org.com"),
    { message: "Only @org.com emails are allowed" }
  ),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Validator for login: requires @org.com email and password
const loginSchema = z.object({
  email: z.string().trim().email("Invalid email format").refine(
    (val) => val.endsWith("@org.com"),
    { message: "Only @org.com emails are allowed" }
  ),
  password: z.string().min(1, "Password is required"),
});

module.exports = {
  registerSchema,
  loginSchema,
};
