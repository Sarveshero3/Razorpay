const { eq, and, ne, inArray } = require("drizzle-orm");
const { users } = require("../src/db/schema/users");
const { reimbursements } = require("../src/db/schema/reimbursements");

function matchRecord(record, condition) {
  if (!condition) return true;

  const cols = [];
  const vals = [];
  const ops = [];

  function traverse(chunk) {
    if (!chunk) return;
    if (chunk.queryChunks) {
      chunk.queryChunks.forEach(traverse);
    } else if (chunk.conditions) {
      chunk.conditions.forEach(traverse);
    } else if (chunk.constructor && chunk.constructor.name === "SQL") {
      if (chunk.queryChunks) {
        chunk.queryChunks.forEach(traverse);
      }
    } else if (Array.isArray(chunk)) {
      const arrayVals = chunk.map(item => item.value);
      vals.push(arrayVals);
    } else if (chunk.name) {
      const nameMap = {
        id: "id",
        name: "name",
        email: "email",
        password_hash: "passwordHash",
        role: "role",
        created_at: "createdAt",
        emp_id: "empId",
        rm_id: "rmId",
        employee_id: "employeeId",
        title: "title",
        description: "description",
        amount: "amount",
        status: "status",
        rm_approved: "rmApproved",
        ape_approved: "apeApproved",
        approved_by_rm_id: "approvedByRmId",
        approved_by_ape_id: "approvedByApeId",
        updated_at: "updatedAt"
      };
      cols.push(nameMap[chunk.name] || chunk.name);
    } else if (chunk.value !== undefined) {
      if (Array.isArray(chunk.value)) {
        const opStr = chunk.value[0].toLowerCase();
        if (opStr.includes("=")) {
          ops.push("eq");
        } else if (opStr.includes("in")) {
          ops.push("in");
        } else if (opStr.includes("<>") || opStr.includes("!=") || opStr.includes("not")) {
          ops.push("ne");
        }
      } else {
        vals.push(chunk.value);
      }
    }
  }

  traverse(condition);

  // Normalize ops length
  while (ops.length < cols.length) {
    ops.push("eq");
  }

  for (let i = 0; i < cols.length; i++) {
    const col = cols[i];
    const val = vals[i];
    const recordVal = record[col];
    const op = ops[i];

    if (op === "eq") {
      if (recordVal !== val) return false;
    } else if (op === "ne") {
      if (recordVal === val) return false;
    } else if (op === "in") {
      if (!Array.isArray(val) || !val.includes(recordVal)) return false;
    }
  }

  return true;
}

// Test cases
const r1 = { id: "123", employeeId: "emp-1", status: "PENDING", rmApproved: true, apeApproved: false };
const r2 = { id: "456", employeeId: "emp-2", status: "REJECTED", rmApproved: false, apeApproved: false };

const cond1 = eq(reimbursements.employeeId, "emp-1");
console.log("r1 match cond1:", matchRecord(r1, cond1)); // expected: true
console.log("r2 match cond1:", matchRecord(r2, cond1)); // expected: false

const cond2 = and(eq(reimbursements.rmApproved, true), eq(reimbursements.status, "PENDING"));
console.log("r1 match cond2:", matchRecord(r1, cond2)); // expected: true
console.log("r2 match cond2:", matchRecord(r2, cond2)); // expected: false

const cond3 = ne(reimbursements.status, "REJECTED");
console.log("r1 match cond3:", matchRecord(r1, cond3)); // expected: true
console.log("r2 match cond3:", matchRecord(r2, cond3)); // expected: false

const cond4 = inArray(reimbursements.employeeId, ["emp-1", "emp-3"]);
console.log("r1 match cond4:", matchRecord(r1, cond4)); // expected: true
console.log("r2 match cond4:", matchRecord(r2, cond4)); // expected: false
