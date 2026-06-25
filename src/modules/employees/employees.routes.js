const express = require("express");
const employeesController = require("./employees.controller");
const { requireAuth, requireRole } = require("../../middlewares/auth");

const router = express.Router();

// Get employee directory: requires authenticated user (visibility check is done inside the service)
router.get("/", requireAuth, employeesController.getEmployeesList);

// Assignment management: restricted strictly to the CFO role
router.post("/assign", requireAuth, requireRole("CFO"), employeesController.assignEmployee);
router.delete("/assign", requireAuth, requireRole("CFO"), employeesController.removeAssignment);

module.exports = router;
