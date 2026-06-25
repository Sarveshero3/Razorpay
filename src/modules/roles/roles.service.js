const rolesRepository = require("./roles.repository");
const { NotFoundError } = require("../../utils/errors");

class RolesService {
  async assignRole(userId, newRole) {
    // 1. Look up user to verify existence; return 404 if user not found
    const user = await rolesRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const oldRole = user.role;
    if (oldRole === newRole) {
      // Idempotency check: if role is unchanged, return current user record
      const { passwordHash: _, ...userWithoutHash } = user;
      return userWithoutHash;
    }

    // 2. Perform the role update database operation
    const updatedUser = await rolesRepository.updateUserRole(userId, newRole);

    // 3. Cascade Cleanups
    // Why: If a user's role is reassigned away from EMP, they cannot report to a manager. Remove their assignment.
    if (oldRole === "EMP" && newRole !== "EMP") {
      await rolesRepository.clearAssignmentsForEmp(userId);
    }
    // Why: If a user's role is reassigned away from RM, they can no longer manage others. Remove all their subordinate mappings.
    if (oldRole === "RM" && newRole !== "RM") {
      await rolesRepository.clearAssignmentsForRm(userId);
    }

    const { passwordHash: _, ...userWithoutHash } = updatedUser;
    return userWithoutHash;
  }
}

module.exports = new RolesService();
