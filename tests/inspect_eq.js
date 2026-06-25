const { eq, and } = require("drizzle-orm");
const { users } = require("../src/db/schema/users");

const condition1 = eq(users.email, "cfo@org.com");
console.log("eq condition keys:", Object.keys(condition1));
console.log("eq condition value:", JSON.stringify(condition1, null, 2));
console.log("eq condition direct:", condition1);
