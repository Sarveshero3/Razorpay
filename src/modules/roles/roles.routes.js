const express = require("express");
const rolesController = require("./roles.controller");
const { requireAuth, requireRole } = require("../../middlewares/auth");

const router = express.Router();

// Role assignment: CFO access authorization requirement enforced via middlewares
router.post("/assign", requireAuth, requireRole("CFO"), rolesController.assignRole);

module.exports = router;
