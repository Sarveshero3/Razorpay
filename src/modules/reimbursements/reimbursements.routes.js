const express = require("express");
const reimbursementsController = require("./reimbursements.controller");
const { requireAuth, requireRole } = require("../../middlewares/auth");

const router = express.Router();

// Raise reimbursement request: Restricted to Employees (EMP) only
router.post("/", requireAuth, requireRole("EMP"), reimbursementsController.createReimbursement);

// Approve/Reject requests: Requires authorization, role check is performed within the state machine
router.patch("/", requireAuth, reimbursementsController.patchReimbursements);

// View list of reimbursements: Requires authorization, filters list according to user role
router.get("/", requireAuth, reimbursementsController.getReimbursementsList);

// View direct subordinate's reimbursements: Restricted to Reporting Managers (RM) only
router.get("/:userId", requireAuth, requireRole("RM"), reimbursementsController.getReimbursementsForSubordinate);

module.exports = router;
