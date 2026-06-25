const { eq } = require("drizzle-orm");
const { db } = require("../../db/db");
const { users, reportingAssignments } = require("../../db/schema");

class RolesRepository {
  // Query user by primary key ID
  async findUserById(userId) {
    return db.query.users.findFirst({
      where: eq(users.id, userId),
    });
  }

  // Update a user's role
  async updateUserRole(userId, role) {
    const [updatedUser] = await db.update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  // Clear reporting assignments where this user is the employee
  async clearAssignmentsForEmp(empId) {
    return db.delete(reportingAssignments)
      .where(eq(reportingAssignments.empId, empId));
  }

  // Clear reporting assignments where this user is the manager
  async clearAssignmentsForRm(rmId) {
    return db.delete(reportingAssignments)
      .where(eq(reportingAssignments.rmId, rmId));
  }
}

module.exports = new RolesRepository();
