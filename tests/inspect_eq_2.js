const { eq } = require("drizzle-orm");
const { users } = require("../src/db/schema/users");

const condition1 = eq(users.email, "cfo@org.com");
condition1.queryChunks.forEach((chunk, index) => {
  console.log(`Chunk ${index}:`, typeof chunk, chunk.constructor ? chunk.constructor.name : 'no-constructor');
  if (chunk && typeof chunk === 'object') {
    console.log(`  Keys:`, Object.keys(chunk));
    console.log(`  Name:`, chunk.name);
    console.log(`  Value:`, chunk.value);
    console.log(`  Target:`, chunk.target ? chunk.target.name : 'no-target');
  } else {
    console.log(`  Value:`, chunk);
  }
});
