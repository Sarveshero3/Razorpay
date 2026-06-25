class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = "error";
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message || "Validation failed", 400);
    this.errors = errors; // Holds specific field-level validation errors
  }
}

class UnauthorizedError extends AppError {
  constructor(message) {
    super(message || "Unauthorized access", 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message) {
    super(message || "Permission denied", 403);
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message || "Resource not found", 404);
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message || "Conflict occurred", 409);
  }
}

module.exports = {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
};
