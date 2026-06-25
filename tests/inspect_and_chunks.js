const { eq, and } = require("drizzle-orm");
const { reimbursements } = require("../src/db/schema/reimbursements");

const condition = and(eq(reimbursements.employeeId, "some-id"), eq(reimbursements.status, "PENDING"));
condition.queryChunks.forEach((chunk, index) => {
  console.log(`Chunk ${index}:`, typeof chunk, chunk.constructor ? chunk.constructor.name : 'no-constructor');
  if (chunk && typeof chunk === 'object') {
    console.log(`  Name:`, chunk.name);
    console.log(`  Value:`, chunk.value);
  }
});
