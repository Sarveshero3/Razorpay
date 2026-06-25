const reimbursementsRepository = require("./reimbursements.repository");
const employeesRepository = require("../employees/employees.repository");
const { ForbiddenError, ValidationError, ConflictError, NotFoundError } = require("../../utils/errors");

// Strategy Pattern: maps roles to their authorized database queries for listing reimbursements
const visibilityStrategies = {
  EMP: async (userId) => {
    // EMP: own reimbursements, all statuses
    return reimbursementsRepository.getReimbursementsForEmployee(userId);
  },
  RM: async (userId) => {
    // RM: PENDING reimbursements from their EMPs only
    return reimbursementsRepository.getPendingReimbursementsForRmSubordinates(userId);
  },
  APE: async () => {
    // APE: PENDING at APE level but already approved by RM (rmApproved=true, apeApproved=false, status PENDING)
    return reimbursementsRepository.getReimbursementsForApe();
  },
  CFO: async () => {
    // CFO: already approved by APEs (apeApproved=true, status not REJECTED)
    return reimbursementsRepository.getReimbursementsForCfo();
  },
};

class ReimbursementsService {
  // GET /rest/reimbursements: Fetch filtered list based on RBAC strategies
  async getReimbursementsList(role, userId) {
    const strategy = visibilityStrategies[role];
    if (!strategy) {
      throw new ForbiddenError("Forbidden: Access denied");
    }

    const list = await strategy(userId);
    
    // Map list to return clean, standardized properties
    return list.map((r) => ({
      id: r.id,
      employeeId: r.employeeId,
      title: r.title,
      description: r.description,
      amount: r.amount,
      status: r.status,
      rmApproved: r.rmApproved,
      apeApproved: r.apeApproved,
      approvedByRmId: r.approvedByRmId,
      approvedByApeId: r.approvedByApeId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  // GET /rest/reimbursements/<user-id>: Subordinate check and fetch
  async getReimbursementsForSubordinate(rmUserId, subordinateId) {
    // 1. Validate target subordinate exists
    const subordinate = await employeesRepository.findUserById(subordinateId);
    if (!subordinate || subordinate.role !== "EMP") {
      throw new NotFoundError("Subordinate employee not found");
    }

    // 2. Validate reporting assignment relationship
    // Why: Only valid if subordinate reports directly to calling RM. Return 403 Forbidden if not.
    const isSubordinate = await reimbursementsRepository.checkReportingRelationship(subordinateId, rmUserId);
    if (!isSubordinate) {
      throw new ForbiddenError("Access denied: User is not a direct subordinate employee of yours");
    }

    return reimbursementsRepository.getReimbursementsForEmployee(subordinateId);
  }

  // POST /rest/reimbursements: Employee raises a request
  async createReimbursement(employeeId, data) {
    return reimbursementsRepository.createReimbursement({
      employeeId,
      title: data.title,
      description: data.description,
      amount: data.amount,
    });
  }

  // PATCH /rest/reimbursements: Handle state transitions and approval flows
  async patchReimbursements(callerRole, callerId, targetId, statusInput) {
    // 1. Resolve spec body ambiguity: targetId can be a reimbursement ID (UUID) or employee ID (UUID)
    let targetReimbursements = [];
    
    const reimbursement = await reimbursementsRepository.findReimbursementById(targetId);
    if (reimbursement) {
      targetReimbursements.push(reimbursement);
    } else {
      // If it doesn't match a reimbursement directly, look up pending requests belonging to the employee matching targetId
      const pendingRequests = await reimbursementsRepository.findPendingReimbursementsByEmployeeId(targetId);
      if (pendingRequests && pendingRequests.length > 0) {
        targetReimbursements = pendingRequests;
      }
    }

    if (targetReimbursements.length === 0) {
      throw new NotFoundError("No pending reimbursement request found matching the provided ID");
    }

    // 2. Run the State Machine updates on all matched records
    const updatedRecords = [];
    for (const record of targetReimbursements) {
      // State transition checks
      
      // Guard: REJECTED status is terminal
      if (record.status === "REJECTED") {
        throw new ValidationError("Reimbursement is already in terminal REJECTED state");
      }

      // Check access and transition permissions depending on current callerRole
      if (callerRole === "EMP") {
        // Employees are forbidden from modifying raised requests
        throw new ForbiddenError("Employees cannot approve or reject reimbursements");
      }

      const updates = {};

      if (callerRole === "RM") {
        // RM: can approve/reject only reimbursements from their own EMPs, only while PENDING and not yet rmApproved
        const reportsToCaller = await reimbursementsRepository.checkReportingRelationship(record.employeeId, callerId);
        if (!reportsToCaller) {
          // Why: RM trying to approve a reimbursement that isn't from their subordinate → 403
          throw new ForbiddenError("Access denied: Target employee does not report to you");
        }

        if (record.status !== "PENDING" || record.rmApproved) {
          // Idempotency: If already approved by RM, return success without duplicate action
          updatedRecords.push(record);
          continue;
        }

        if (statusInput === "REJECTED") {
          updates.status = "REJECTED";
          updates.rmApproved = false;
        } else {
          updates.rmApproved = true;
          updates.approvedByRmId = callerId;
        }
      } 
      
      else if (callerRole === "APE") {
        // APE: can approve/reject only reimbursements already approved by the RM
        if (!record.rmApproved) {
          // Why: APE trying to approve something the RM has not approved yet → 400/409
          throw new ConflictError("Conflict: Reporting Manager has not approved this reimbursement yet");
        }

        if (record.apeApproved) {
          // Idempotency: If already approved by APE, skip
          updatedRecords.push(record);
          continue;
        }

        if (statusInput === "REJECTED") {
          updates.status = "REJECTED";
          updates.apeApproved = false;
        } else {
          updates.apeApproved = true;
          updates.approvedByApeId = callerId;
          // Why: Final status flips to APPROVED once both rmApproved and apeApproved are true
          updates.status = "APPROVED";
        }
      } 
      
      else if (callerRole === "CFO") {
        // CFO: can approve/reject any reimbursement APE has approved (apeApproved = true)
        if (!record.apeApproved) {
          throw new ConflictError("Conflict: Accounts Payable (APE) has not approved this reimbursement yet");
        }

        if (statusInput === "REJECTED") {
          updates.status = "REJECTED";
        } else {
          // CFO approving keeps the status APPROVED
          updates.status = "APPROVED";
        }
      }

      // If changes are required, execute database update
      if (Object.keys(updates).length > 0) {
        const updated = await reimbursementsRepository.updateReimbursement(record.id, updates);
        updatedRecords.push(updated);
      } else {
        updatedRecords.push(record);
      }
    }

    return updatedRecords;
  }
}

module.exports = new ReimbursementsService();
