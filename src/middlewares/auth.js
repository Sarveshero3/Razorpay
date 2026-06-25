const { eq } = require("drizzle-orm");
const { db } = require("../db/db");
const { users } = require("../db/schema");
const { verifyToken } = require("../utils/jwt");
const { UnauthorizedError, ForbiddenError } = require("../utils/errors");

// requireAuth middleware: validates the JWT cookie, and verifies user exists with latest DB role state
async function requireAuth(req, res, next) {
  try {
    // 1. Guard: Check if cookies object is initialized and contains the auth token
    const token = req.cookies ? req.cookies.token : null;
    if (!token) {
      // Why: Must fail early if the client did not send the httpOnly authentication cookie
      throw new UnauthorizedError("Authentication token is missing");
    }

    // 2. Guard: Verify the signature and expiration of the JWT token
    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      // Why: Token signature mismatch or token expired must reject request immediately
      throw new UnauthorizedError("Invalid or expired authentication token");
    }

    // 3. Guard: Fetch the user record from the DB to get the most up-to-date role
    // Why: Spec explicitly requires not trusting the role stored in JWT claim because a CFO
    // role-reassignment must take effect immediately. Re-fetching ensures database consistency.
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    });

    if (!user) {
      // Why: If user was deleted or doesn't exist, we must revoke access
      throw new UnauthorizedError("Authenticated user no longer exists");
    }

    // 4. Attach actual DB values to request context
    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
    };

    next();
  } catch (error) {
    next(error);
  }
}

// requireRole middleware: factory function returning a middleware that asserts req.user has an authorized role
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    try {
      // 1. Guard: Check if req.user is set (requireAuth must be run prior to this middleware)
      if (!req.user) {
        throw new UnauthorizedError("User session not found. Please authenticate first");
      }

      // 2. Guard: Verify the user's current role exists within the authorized roles array
      // Why: Protects the route by verifying permission level, returning a 403 response if unauthorized
      if (!allowedRoles.includes(req.user.role)) {
        throw new ForbiddenError(`Forbidden: ${req.user.role} role does not have access to this resource`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  requireAuth,
  requireRole,
};
