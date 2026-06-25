const { users } = require("../src/db/schema/users");
console.log("users keys:", Object.keys(users));
console.log("users constructor name:", users.constructor.name);
console.log("users tableName:", users.tableName);
for (const sym of Object.getOwnPropertySymbols(users)) {
  console.log(`Symbol ${sym.toString()}:`, users[sym]);
}
