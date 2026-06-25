const { eq, and } = require("drizzle-orm");
const { reimbursements } = require("../src/db/schema/reimbursements");

const condition = and(eq(reimbursements.employeeId, "some-id"), eq(reimbursements.status, "PENDING"));
console.log("And condition keys:", Object.keys(condition));
if (condition.conditions) {
  console.log("Subconditions count:", condition.conditions.length);
  condition.conditions.forEach((sub, i) => {
    console.log(`Subcondition ${i} constructor:`, sub.constructor ? sub.constructor.name : 'no-constructor');
    sub.queryChunks.forEach((chunk, j) => {
      console.log(`  Chunk ${j}:`, chunk.constructor ? chunk.constructor.name : 'no-constructor', "name:", chunk.name, "value:", chunk.value);
    });
  });
}
