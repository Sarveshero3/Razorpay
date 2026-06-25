const { eq, and } = require("drizzle-orm");
const { users } = require("../src/db/schema/users");
const { reimbursements } = require("../src/db/schema/reimbursements");

function extractFilters(condition) {
  const filters = [];
  
  function traverse(chunk) {
    if (!chunk) return;
    if (chunk.queryChunks) {
      chunk.queryChunks.forEach(traverse);
    } else if (chunk.conditions) {
      chunk.conditions.forEach(traverse);
    } else if (Array.isArray(chunk)) {
      chunk.forEach(traverse);
    } else if (chunk.constructor && chunk.constructor.name === "SQL") {
      if (chunk.queryChunks) {
        chunk.queryChunks.forEach(traverse);
      }
    } else if (chunk.name || chunk.value !== undefined) {
      filters.push(chunk);
    }
  }

  traverse(condition);
  return filters;
}

const cond1 = eq(users.email, "cfo@org.com");
console.log("Filters for cond1:", extractFilters(cond1).map(f => ({ name: f.name, value: f.value })));

const cond2 = and(eq(reimbursements.employeeId, "some-id"), eq(reimbursements.status, "PENDING"));
console.log("Filters for cond2:", extractFilters(cond2).map(f => ({ name: f.name, value: f.value })));
