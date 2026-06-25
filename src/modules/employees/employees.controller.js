const employeesService = require("./employees.service");
const { assignEmployeeSchema } = require("./employees.validation");

class EmployeesController {
  // GET /rest/employees: Retrieve company employees based on current user's role
  async getEmployeesList(req, res, next) {
    try {
      const { role, id } = req.user;
      
      const result = await employeesService.getEmployeesList(role, id);

      // Return both users and assignments if result is formatted for CFO org structure
      if (result && !Array.isArray(result) && result.users) {
        return res.status(200).json({
          status: "success",
          data: {
            users: result.users,
            assignments: result.assignments,
          },
        });
      }

      // Return exactly the specified shape: { status: "success", data: { users: [...] } }
      return res.status(200).json({
        status: "success",
        data: {
          users: result,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /rest/employees/assign: CFO assigns an employee to a reporting manager
  async assignEmployee(req, res, next) {
    try {
      const validated = assignEmployeeSchema.parse(req.body);
      
      // Resolve spec field ambiguity: parse both empUserId and fallback userId key
      const empUserId = validated.empUserId || validated.userId;
      
      await employeesService.assignEmployee(empUserId, validated.rmUserId);

      return res.status(200).json({
        status: "success",
        message: "Employee assigned to Reporting Manager successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /rest/employees/assign: CFO removes an assignment mapping
  async removeAssignment(req, res, next) {
    try {
      const validated = assignEmployeeSchema.parse(req.body);
      
      // Resolve spec field ambiguity: parse both empUserId and fallback userId key
      const empUserId = validated.empUserId || validated.userId;
      
      await employeesService.removeAssignment(empUserId, validated.rmUserId);

      return res.status(200).json({
        status: "success",
        message: "Employee assignment removed successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EmployeesController();
