const rolesService = require("./roles.service");
const { assignRoleSchema } = require("./roles.validation");

class RolesController {
  // CFO-only endpoint to assign roles
  async assignRole(req, res, next) {
    try {
      // Validate request body fields
      const validated = assignRoleSchema.parse(req.body);

      const user = await rolesService.assignRole(validated.userId, validated.role);

      return res.status(200).json({
        status: "success",
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RolesController();
