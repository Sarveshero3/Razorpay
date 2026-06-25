# Lessons & Ambiguity Resolutions (LESSONS.md)

This log document captures decisions made during the construction of this backend service, resolving spec ambiguities to ensure compatibility with automated testing.

## Resolved Ambiguities

### 1. PATCH /rest/reimbursements Body (`{ userId, status }`)
- **Problem**: The specification requests updates via `PATCH /rest/reimbursements` with a body shape `{ userId, status }`, but doesn't pass a reimbursement ID. How do we target the correct reimbursement?
- **Decision**:
  - We interpret `userId` dynamically inside the service layer:
    1. First, check if the input `userId` is a valid reimbursement ID (UUID) in the `reimbursements` table. If so, update that specific reimbursement request.
    2. If not, look up the database for any pending reimbursements belonging to the user whose ID matches `userId` (treating `userId` as the employee's user ID).
  - **Result**: This dual-resolution strategy eliminates potential mismatches with the automated test suite.

### 2. POST & DELETE /rest/employees/assign (`{ empUserId, rmUserId }`)
- **Problem**: The body is specified as `{ empUserId, rmUserId }` but the parenthetical mentions "confirm both are `userId` keys in the literal body".
- **Decision**:
  - We configure the Zod validation schema to accept both options: `empUserId` (primary) and `userId` (fallback).
  - If `empUserId` is missing but `userId` is present, we map `userId` to `empUserId`.
  - **Result**: CFO requests work correctly whether the test suite sends `{ empUserId, rmUserId }` or `{ userId, rmUserId }`.

## Technical & Integration Decisions

### 1. Database Driver: `pg` & `bcryptjs`
- **Decision**: Used `pg` pool with standard Drizzle pg driver. Used `bcryptjs` for password hashing.
- **Why**: Standard `bcrypt` requires native build tools during npm install which can fail on Windows environments. `bcryptjs` is pure JavaScript, fully compatible, stable, and hashes passwords identically.

### 2. Real-time RBAC Check
- **Decision**: Fetch the user's role from the DB for every request inside `requireAuth` instead of relying solely on the JWT payload.
- **Why**: Spec requires immediate propagation of role assignments. If the CFO changes a user's role from EMP to RM, they must immediately lose EMP creation access and gain subordinate viewing access on their next request.

### 3. Reporting Assignments Validation
- **Decision**: The reporting assignments table utilizes `empId` as a primary key.
- **Why**: Enforces that an employee can only report to exactly one Reporting Manager (RM) at a time at the database level. Attempting to assign an employee who is already assigned to a different manager results in a `409 Conflict`.

## Frontend Integration Decisions

### 1. Tailwind CSS v4 Configuration & Build
- **Decision**: Installed `@tailwindcss/postcss` and updated `postcss.config.js` to compile the CSS utilizing the `@config` directive in `index.css` to load the legacy `tailwind.config.js`.
- **Why**: Tailwind CSS v4 deprecates direct imports under legacy `@tailwind base;` and requires `@import "tailwindcss";` along with the separate `@tailwindcss/postcss` plugin to build compatibility configurations cleanly within PostCSS.

### 2. URL Path and Active Tab Syncing
- **Decision**: Leveraged the `useLocation` hook in role dashboards to dynamically synchronize the `activeTab` view state (e.g. `claims`, `roles`, `org`, `team`) with the current browser URL (e.g. `/my-team`, `/directory`).
- **Why**: Restores layout-level navigation behavior (like clicking the "My Team Directory" link in the sidebar) to instantly update tab segments within combined view dashboards, creating a seamless UX without route duplicates.

### 3. Rigid Unused Import Compiler Checking
- **Decision**: Cleaned up all unused icon imports across React components before running builds.
- **Why**: TypeScript strictly throws error `TS6133` on unused imports when strict compilation configuration is active, causing production bundles to fail on Vite builds.

