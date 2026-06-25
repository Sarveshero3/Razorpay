const { eq, inArray, and } = require("drizzle-orm");
const { db } = require("../../db/db");
const { users, reportingAssignments } = require("../../db/schema");

class EmployeesRepository {
  // Find user by ID
  async findUserById(userId) {
    return db.query.users.findFirst({
      where: eq(users.id, userId),
    });
  }

  // Find assignment row by employee ID
  async findReportingAssignment(empId) {
    return db.query.reportingAssignments.findFirst({
      where: eq(reportingAssignments.empId, empId),
    });
  }

  // Find exact employee to manager mapping
  async findReportingAssignmentExact(empId, rmId) {
    return db.query.reportingAssignments.findFirst({
      where: and(
        eq(reportingAssignments.empId, empId),
        eq(reportingAssignments.rmId, rmId)
      ),
    });
  }

  // Create employee reporting assignment
  async createReportingAssignment(empId, rmId) {
    const [assignment] = await db.insert(reportingAssignments)
      .values({ empId, rmId })
      .returning();
    return assignment;
  }

  // Remove employee reporting assignment
  async deleteReportingAssignment(empId, rmId) {
    const [deleted] = await db.delete(reportingAssignments)
      .where(and(
        eq(reportingAssignments.empId, empId),
        eq(reportingAssignments.rmId, rmId)
      ))
      .returning();
    return deleted;
  }

  // Fetch employees reporting directly to a specific Reporting Manager (RM)
  async getEmployeesReportingTo(rmId) {
    const assignments = await db.query.reportingAssignments.findMany({
      where: eq(reportingAssignments.rmId, rmId),
    });
    
    if (assignments.length === 0) return [];
    
    const empIds = assignments.map((a) => a.empId);
    return db.query.users.findMany({
      where: inArray(users.id, empIds),
    });
  }

  // Fetch all users with either 'EMP' or 'RM' roles for Accounts Payable (APE)
  async getAllEmployeesAndRMs() {
    return db.query.users.findMany({
      where: inArray(users.role, ["EMP", "RM"]),
    });
  }

  // Fetch all users for CFO visibility
  async getAllUsers() {
    return db.query.users.findMany();
  }
}

module.exports = new EmployeesRepository();
