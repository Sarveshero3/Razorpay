const { ZodError } = require("zod");
const { AppError } = require("../utils/errors");

function errorHandler(err, req, res, next) {
  // Handle Zod validation errors (e.g. malformed body fields)
  if (err instanceof ZodError) {
    const formattedErrors = err.issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return res.status(400).json({
      status: "error",
      message: "Validation failed",
      errors: formattedErrors,
    });
  }

  // Handle explicitly raised Application Errors (like NotFound, Conflict, Forbidden)
  if (err instanceof AppError) {
    const response = {
      status: "error",
      message: err.message,
    };
    if (err.errors && err.errors.length > 0) {
      response.errors = err.errors;
    }
    return res.status(err.statusCode).json(response);
  }

  // Log unknown/uncaught runtime errors and return a clean 500 response (avoiding leak of internals)
  console.error("UNEXPECTED ERROR:", err);
  return res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
}

module.exports = errorHandler;
