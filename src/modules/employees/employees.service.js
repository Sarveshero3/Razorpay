const employeesRepository = require("./employees.repository");
const { ForbiddenError, ValidationError, ConflictError, NotFoundError } = require("../../utils/errors");

// Strategy Pattern: maps roles to their authorized database queries to avoid nested if/else
const visibilityStrategies = {
  EMP: async () => {
    // EMP: 403 Forbidden
    throw new ForbiddenError("Forbidden: Employees are not allowed to list employees");
  },
  RM: async (userId) => {
    // RM: only EMPs reporting directly to the calling manager
    return employeesRepository.getEmployeesReportingTo(userId);
  },
  APE: async () => {
    // APE: all EMPs and RMs in the system
    return employeesRepository.getAllEmployeesAndRMs();
  },
  CFO: async () => {
    // CFO: everyone in the company database + reporting assignments
    const users = await employeesRepository.getAllUsers();
    const { db } = require("../../db/db");
    const assignments = await db.query.reportingAssignments.findMany();
    return {
      users,
      assignments: assignments.map((a) => ({ empId: a.empId, rmId: a.rmId })),
    };
  },
};

class EmployeesService {
  // Retrieve employees with RBAC-filtered visibility
  async getEmployeesList(role, userId) {
    const strategy = visibilityStrategies[role];
    if (!strategy) {
      throw new ForbiddenError("Forbidden: Access denied");
    }

    const result = await strategy(userId);
    
    // Check if result contains assignments (CFO custom payload)
    if (result && !Array.isArray(result) && result.users) {
      return {
        users: result.users.map((u) => ({
          userId: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
        })),
        assignments: result.assignments,
      };
    }

    // Format response exactly as specified: { userId, name, email, role }
    return result.map((u) => ({
      userId: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
    }));
  }

  // Create a reporting relationship mapping
  async assignEmployee(empUserId, rmUserId) {
    const empUser = await employeesRepository.findUserById(empUserId);
    const rmUser = await employeesRepository.findUserById(rmUserId);

    if (!empUser) {
      throw new ValidationError("Employee user not found");
    }
    if (!rmUser) {
      throw new ValidationError("Reporting manager user not found");
    }

    // Role check validations
    // Why: Ensure the employee has the EMP role, and the manager has the RM role. Return 400 if invalid.
    if (empUser.role !== "EMP") {
      throw new ValidationError("Invalid pairing: target user is not an Employee (EMP)");
    }
    if (rmUser.role !== "RM") {
      throw new ValidationError("Invalid pairing: target manager does not have the Reporting Manager (RM) role");
    }

    // Check if the employee is already assigned to a different manager
    const existing = await employeesRepository.findReportingAssignment(empUserId);
    if (existing) {
      if (existing.rmId === rmUserId) {
        // Idempotent success if it's the exact same assignment
        return existing;
      }
      // Why: Reject with 409 Conflict if employee already reports to another manager
      throw new ConflictError("Conflict: Employee is already assigned to a different Reporting Manager");
    }

    return employeesRepository.createReportingAssignment(empUserId, rmUserId);
  }

  // Delete a reporting relationship mapping
  async removeAssignment(empUserId, rmUserId) {
    const assignment = await employeesRepository.findReportingAssignmentExact(empUserId, rmUserId);
    
    // Why: Return 404 if no assignment matches the criteria
    if (!assignment) {
      throw new NotFoundError("Reporting assignment not found for this pairing");
    }

    return employeesRepository.deleteReportingAssignment(empUserId, rmUserId);
  }
}

module.exports = new EmployeesService();
