# AI Agent Hand-off (AGENTS.md)

Welcome! This document defines the conventions, constraints, and architecture of this repository. Adhere to these instructions exactly when modifying or extending this codebase.

## Hard Constraints

1. **Language & Environment**:
   - Written in Node.js >= 20.10.2 using **JavaScript** (CommonJS module system via `require` / `module.exports`).
   - **NO TypeScript** is allowed.
2. **Express Server Port**:
   - The dev server starts strictly on port **7002** using `nodemon`.
3. **Cookie-Based Authentication**:
   - Authenticated routes read a signed JWT cookie named `token` (issued during login as an `httpOnly`, `sameSite: strict`, `secure: production` cookie).
   - Do **NOT** use or parse the `Authorization` header.
4. **Validation**:
   - Input validation must be performed at API boundaries using `Zod` schemas colocated in `*.validation.js` files.

## Project Structure & Architecture

We enforce a strict layered architecture: **Router ➔ Controller ➔ Service ➔ Repository (Drizzle)**.

- **Routes (`*.routes.js`)**: Map paths to controller methods and bind role checks. No business logic here.
- **Controllers (`*.controller.js`)**: Parse parameters, trigger validation, delegate to services, and send HTTP responses.
- **Services (`*.service.js`)**: Handle core business logic, permissions checks, and validation logic.
- **Repositories (`*.repository.js`)**: Contain Drizzle queries (`db.select`, `db.insert`, `db.update`, `db.delete`) only.

```
src/
  config/
  db/
    schema/          # Drizzle tables schema definition files
    db.js            # Initializes Pool (pg) and Drizzle connection
    migrate.js       # Database migration runner script
    seed.js          # CFO account seeder script
  middlewares/
    auth.js          # Authentication (requireAuth) and RBAC (requireRole) middlewares
    errorHandler.js  # Centralized error handler returning consistent error JSON
  modules/
    onboarding/      # Register, Login, and Logout
    roles/           # CFO-only role assignment
    employees/       # Employee directories and reporting assignments
    reimbursements/  # Reimbursement submission and approval state machine
  utils/
    errors.js        # Standardized custom error classes (ValidationError, ConflictError, etc.)
    jwt.js           # JWT signing and verification helpers
    password.js      # Password bcrypt hashing helpers
```

## Developer & Run Commands

- **Start Local Server**: `npm run dev`
- **Run DB Migrations**: `npm run db:migrate`
- **Seed CFO Root Account**: `npm run db:seed-data`
- **Generate Migrations**: `npx drizzle-kit generate`

## Design Conventions

1. **RBAC Role Refreshing**:
   - Stale JWT claims are not trusted. The `requireAuth` middleware re-fetches the user record from the database on every request so role reassignments take effect instantly.
2. **Reimbursement Approval State Machine**:
   - Isolated in [reimbursements.service.js](file:///c:/Users/Sarvesh/Desktop/3rd%20Year/Bootcamp/Razorpay/src/modules/reimbursements/reimbursements.service.js) to keep transitions unified.
3. **Double Approval Idempotency**:
   - Multi-approval calls by the same role are treated as idempotent and return success without modifying status.
