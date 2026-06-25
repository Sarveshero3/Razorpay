const crypto = require("crypto");
const bcrypt = require("bcryptjs");

// Factory function to initialize an in-memory DB mimicking Drizzle query methods
function createMockDb() {
  const cfoPasswordHash = bcrypt.hashSync("CFO#ORG@April2026", 10);
  const usersList = [
    {
      id: "cfo-root-user-uuid",
      name: "Chief Financial Officer",
      email: "cfo@org.com",
      passwordHash: cfoPasswordHash,
      role: "CFO",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
  const assignmentsList = [];
  const reimbursementsList = [];

  const uuid = () => crypto.randomUUID();

  // Helper to extract the table name from a Drizzle table object
  function getTableName(table) {
    if (!table) return null;
    if (table.tableName) return table.tableName;
    const symbols = Object.getOwnPropertySymbols(table);
    const nameSymbol = symbols.find(
      (s) => s.toString().includes("drizzle:Name") || s.toString().includes("drizzle:BaseName")
    );
    return nameSymbol ? table[nameSymbol] : null;
  }

  // Evaluates Drizzle condition expressions recursively against in-memory records
  function matchRecord(record, condition) {
    if (!condition) return true;

    const cols = [];
    const vals = [];
    const ops = [];

    // Traverse the compiled SQL expression chunk tree
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
        // Handles inArray lists
        const arrayVals = chunk.map(item => item.value);
        vals.push(arrayVals);
      } else if (chunk.name) {
        // Maps database column names to schema properties in the JS object
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

    // Normalize ops to eq if they are shorter than columns
    while (ops.length < cols.length) {
      ops.push("eq");
    }

    // Evaluate all criteria
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

  return {
    insert: (table) => ({
      values: (val) => {
        const execute = async () => {
          const record = {
            ...val,
            id: val.id || uuid(),
            createdAt: new Date(),
            updatedAt: new Date()
          };
          const tName = getTableName(table);
          if (tName === "users") {
            usersList.push(record);
          } else if (tName === "reporting_assignments") {
            assignmentsList.push(record);
          } else if (tName === "reimbursements") {
            reimbursementsList.push(record);
          }
          return [record];
        };
        return {
          returning: execute,
          onConflictDoNothing: () => ({
            returning: execute,
            then: (resolve) => execute().then(resolve)
          }),
          then: (resolve) => execute().then(resolve)
        };
      }
    }),

    update: (table) => ({
      set: (val) => ({
        where: (cond) => {
          const execute = async () => {
            let list = [];
            const tName = getTableName(table);
            if (tName === "users") list = usersList;
            else if (tName === "reimbursements") list = reimbursementsList;

            const updated = [];
            for (const record of list) {
              if (matchRecord(record, cond)) {
                Object.assign(record, val, { updatedAt: new Date() });
                updated.push(record);
              }
            }
            return updated;
          };
          return {
            returning: execute,
            then: (resolve) => execute().then(resolve)
          };
        }
      })
    }),

    delete: (table) => ({
      where: (cond) => {
        const execute = async () => {
          let list = [];
          const tName = getTableName(table);
          if (tName === "reporting_assignments") list = assignmentsList;
          else if (tName === "reimbursements") list = reimbursementsList;

          const deleted = [];
          for (let i = list.length - 1; i >= 0; i--) {
            const record = list[i];
            if (matchRecord(record, cond)) {
              deleted.push(record);
              list.splice(i, 1);
            }
          }
          return deleted;
        };
        return {
          returning: execute,
          then: (resolve) => execute().then(resolve)
        };
      }
    }),

    query: {
      users: {
        findFirst: async (options) => {
          const cond = options ? options.where : null;
          return usersList.find(u => matchRecord(u, cond));
        },
        findMany: async (options) => {
          const cond = options ? options.where : null;
          return usersList.filter(u => matchRecord(u, cond));
        }
      },

      reportingAssignments: {
        findFirst: async (options) => {
          const cond = options ? options.where : null;
          return assignmentsList.find(a => matchRecord(a, cond));
        },
        findMany: async (options) => {
          const cond = options ? options.where : null;
          return assignmentsList.filter(a => matchRecord(a, cond));
        }
      },

      reimbursements: {
        findFirst: async (options) => {
          const cond = options ? options.where : null;
          return reimbursementsList.find(r => matchRecord(r, cond));
        },
        findMany: async (options) => {
          const cond = options ? options.where : null;
          return reimbursementsList.filter(r => matchRecord(r, cond));
        }
      }
    }
  };
}

module.exports = { createMockDb };
