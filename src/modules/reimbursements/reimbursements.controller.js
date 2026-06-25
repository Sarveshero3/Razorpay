const reimbursementsService = require("./reimbursements.service");
const { createReimbursementSchema, patchReimbursementSchema } = require("./reimbursements.validation");

class ReimbursementsController {
  // GET /rest/reimbursements: Retrieve list of eligible reimbursements
  async getReimbursementsList(req, res, next) {
    try {
      const { role, id } = req.user;
      
      const list = await reimbursementsService.getReimbursementsList(role, id);

      // Return exactly specified format: { status: "success", data: { reimbursements: [...] } }
      return res.status(200).json({
        status: "success",
        data: {
          reimbursements: list,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /rest/reimbursements/<user-id>: Retrieve reimbursements for a subordinate employee (RM access only)
  async getReimbursementsForSubordinate(req, res, next) {
    try {
      const rmUserId = req.user.id;
      const subordinateId = req.params.userId;
      
      const list = await reimbursementsService.getReimbursementsForSubordinate(rmUserId, subordinateId);

      return res.status(200).json({
        status: "success",
        data: {
          reimbursements: list,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /rest/reimbursements: Raise a new reimbursement request
  async createReimbursement(req, res, next) {
    try {
      // Validate creation request body (checks for positive amount)
      const validated = createReimbursementSchema.parse(req.body);
      const employeeId = req.user.id;
      
      const reimbursement = await reimbursementsService.createReimbursement(employeeId, validated);

      return res.status(201).json({
        status: "success",
        data: {
          reimbursement,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // PATCH /rest/reimbursements: Action on pending requests (Approve/Reject)
  async patchReimbursements(req, res, next) {
    try {
      // Validate inputs (checks userId is a valid UUID, status in [APPROVED, REJECTED])
      const validated = patchReimbursementSchema.parse(req.body);
      const { role, id: callerId } = req.user;
      
      const updated = await reimbursementsService.patchReimbursements(
        role,
        callerId,
        validated.userId,
        validated.status
      );

      return res.status(200).json({
        status: "success",
        message: "Reimbursement status updated successfully",
        data: {
          reimbursements: updated,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReimbursementsController();
