const { eq, and, ne, inArray } = require("drizzle-orm");
const { db } = require("../../db/db");
const { reimbursements, reportingAssignments } = require("../../db/schema");

class ReimbursementsRepository {
  // Create a new reimbursement request in PENDING state
  async createReimbursement(data) {
    const [newReimbursement] = await db.insert(reimbursements)
      .values({
        employeeId: data.employeeId,
        title: data.title,
        description: data.description,
        amount: data.amount,
        status: "PENDING",
        rmApproved: false,
        apeApproved: false,
      })
      .returning();
    return newReimbursement;
  }

  // Find a specific reimbursement record by UUID
  async findReimbursementById(id) {
    return db.query.reimbursements.findFirst({
      where: eq(reimbursements.id, id),
    });
  }

  // Find all pending reimbursements belonging to a specific employee
  async findPendingReimbursementsByEmployeeId(employeeId) {
    return db.query.reimbursements.findMany({
      where: and(
        eq(reimbursements.employeeId, employeeId),
        eq(reimbursements.status, "PENDING")
      ),
    });
  }

  // Update reimbursement record
  async updateReimbursement(id, updateData) {
    const [updated] = await db.update(reimbursements)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(reimbursements.id, id))
      .returning();
    return updated;
  }

  // Fetch all reimbursements raised by an employee
  async getReimbursementsForEmployee(employeeId) {
    return db.query.reimbursements.findMany({
      where: eq(reimbursements.employeeId, employeeId),
    });
  }

  // RM: Fetch PENDING reimbursements from subordinates only
  async getPendingReimbursementsForRmSubordinates(rmId) {
    const assignments = await db.query.reportingAssignments.findMany({
      where: eq(reportingAssignments.rmId, rmId),
    });
    
    if (assignments.length === 0) return [];
    
    const empIds = assignments.map((a) => a.empId);
    return db.query.reimbursements.findMany({
      where: and(
        eq(reimbursements.status, "PENDING"),
        inArray(reimbursements.employeeId, empIds)
      ),
    });
  }

  // APE: Fetch reimbursements PENDING at APE level (RM approved, APE not yet approved)
  async getReimbursementsForApe() {
    return db.query.reimbursements.findMany({
      where: and(
        eq(reimbursements.rmApproved, true),
        eq(reimbursements.apeApproved, false),
        eq(reimbursements.status, "PENDING")
      ),
    });
  }

  // CFO: Fetch all reimbursements approved by APEs that are not rejected
  async getReimbursementsForCfo() {
    return db.query.reimbursements.findMany({
      where: and(
        eq(reimbursements.apeApproved, true),
        ne(reimbursements.status, "REJECTED")
      ),
    });
  }

  // Verify if empId reports to rmId
  async checkReportingRelationship(empId, rmId) {
    const assignment = await db.query.reportingAssignments.findFirst({
      where: and(
        eq(reportingAssignments.empId, empId),
        eq(reportingAssignments.rmId, rmId)
      ),
    });
    return !!assignment;
  }
}

module.exports = new ReimbursementsRepository();
