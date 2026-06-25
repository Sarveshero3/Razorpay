const { inArray } = require("drizzle-orm");
const { users } = require("../src/db/schema/users");

const cond = inArray(users.role, ["EMP", "RM"]);
cond.queryChunks.forEach((chunk, index) => {
  console.log(`Chunk ${index}:`, typeof chunk, chunk.constructor ? chunk.constructor.name : 'no-constructor');
  if (chunk && typeof chunk === 'object') {
    console.log(`  Name:`, chunk.name);
    console.log(`  Value:`, chunk.value);
  }
});
