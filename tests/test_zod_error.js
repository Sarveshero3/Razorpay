const { z, ZodError } = require("zod");

try {
  z.string().parse(123);
} catch (err) {
  console.log("Is instanceof ZodError:", err instanceof ZodError);
  console.log("err keys:", Object.keys(err));
  console.log("err.issues:", err.issues);
  console.log("err.errors:", err.errors);
}
