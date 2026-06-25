# Reimbursements Management Backend

A backend service built with Express.js, PostgreSQL, Drizzle ORM, Zod, and HTTP-only cookie JWT auth, featuring strict Role-Based Access Control (RBAC).

## Features

- **Centralized Authorization**: Role verification is decoupled from controllers and managed using composable Express middlewares.
- **Immediate Role Updates**: The authentication middleware queries the database for the user's role on every request to ensure role changes take effect immediately.
- **Reimbursement State Machine**: Managed centrally with structured, validated state changes.
- **Centralized Error Handling**: Transforms database constraints, Zod validations, and custom API errors into a unified response shape.

## Tech Stack

- **Language**: JavaScript (CommonJS)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Validation**: Zod
- **Authentication**: JWT stored in httpOnly cookie

## Installation & Setup

1. **Clone the repository and install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root directory (matching `.env.example`):
   ```env
   DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>
   JWT_SECRET=your_jwt_secret_key
   PORT=7002
   ```

3. **Run Migrations**:
   Run Drizzle migrations against your PostgreSQL instance:
   ```bash
   npm run db:migrate
   ```

4. **Seed CFO Root Account**:
   Seed the default CFO root credentials:
   ```bash
   npm run db:seed-data
   ```

5. **Start Dev Server**:
   Run the Express server locally on port 7002 (configured via nodemon):
   ```bash
   npm run dev
   ```

## Frontend Console Setup & Execution

The system features a React + Vite + TypeScript web interface located in the `frontend` directory.

1. **Install Frontend Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start Frontend Dev Server**:
   Launches the Vite client dashboard locally on port 3000:
   ```bash
   npm run dev
   ```

3. **Build Frontend Bundle**:
   Compiles the frontend assets to the `frontend/dist/` directory:
   ```bash
   npm run build
   ```

## Assumptions & Design Choices

Detailed descriptions of spec clarifications can be found in [LESSONS.md](file:///c:/Users/Sarvesh/Desktop/3rd%20Year/Bootcamp/Razorpay/LESSONS.md) and [AGENTS.md](file:///c:/Users/Sarvesh/Desktop/3rd%20Year/Bootcamp/Razorpay/AGENTS.md).
- **PATCH /rest/reimbursements**: Supports passing either a reimbursement ID or an employee user ID as `userId`.
- **POST /rest/employees/assign**: Supports both `empUserId` and fallback `userId` keys in the request body.
- **Reporting Assignments**: Employees are limited to one RM at a time (enforced via database primary key on `empId`).
