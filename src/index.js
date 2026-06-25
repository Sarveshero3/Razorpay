const express = require("express");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const onboardingRouter = require("./modules/onboarding/onboarding.routes");
const rolesRouter = require("./modules/roles/roles.routes");
const employeesRouter = require("./modules/employees/employees.routes");
const reimbursementsRouter = require("./modules/reimbursements/reimbursements.routes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// Global request parsing middlewares
app.use(express.json());
app.use(cookieParser());

// Custom CORS middleware to support cookie-based auth from frontend on port 3000
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Route registrations under /rest prefix
app.use("/rest/onboardings", onboardingRouter);
app.use("/rest/roles", rolesRouter);
app.use("/rest/employees", employeesRouter);
app.use("/rest/reimbursements", reimbursementsRouter);

// Centralized error mapping and formatting middleware
app.use(errorHandler);

// Define PORT - must strictly default to 7002 as per instructions
const PORT = process.env.PORT || 7002;

const server = app.listen(PORT, () => {
  console.log(`Server is running strictly on port ${PORT}`);
});

module.exports = { app, server };
