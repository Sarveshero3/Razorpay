process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "testsecretkeytestsecretkeytestsecretkey";

const test = require("node:test");
const assert = require("node:assert");
const { app, server } = require("../src/index");
const { db } = require("../src/db/db");
const { users } = require("../src/db/schema");
const bcrypt = require("bcryptjs");

// Helper to seed CFO user in mock database
async function seedCfo() {
  const passwordHash = await bcrypt.hash("CFO#ORG@April2026", 10);
  await db.insert(users).values({
    name: "Chief Financial Officer",
    email: "cfo@org.com",
    passwordHash: passwordHash,
    role: "CFO",
  });
}

// Helper to execute REST API requests against the running test server
async function apiRequest(path, method = "GET", body = null, cookie = "") {
  const address = server.address();
  const url = `http://localhost:${address.port}${path}`;
  const options = {
    method,
    headers: {},
  };
  if (body) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }
  if (cookie) {
    options.headers["Cookie"] = cookie;
  }
  const res = await fetch(url, options);
  const data = await res.json();
  const setCookie = res.headers.get("set-cookie");
  return { status: res.status, data, setCookie };
}

test("Reimbursements API E2E Integration Suite", async (t) => {
  // Seed the root CFO account
  await seedCfo();

  let cfoCookie = "";
  let empCookie = "";
  let rmCookie = "";
  let apeCookie = "";
  let empId = "";
  let rmId = "";
  let apeId = "";
  let reimbursementId = "";

  await t.test("CFO login should succeed and return httpOnly cookie", async () => {
    const res = await apiRequest("/rest/onboardings/login", "POST", {
      email: "cfo@org.com",
      password: "CFO#ORG@April2026",
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.status, "success");
    assert.ok(res.setCookie && res.setCookie.includes("token="));
    cfoCookie = res.setCookie.split(";")[0];
  });

  await t.test("EMP self-registration should succeed with role EMP", async () => {
    const res = await apiRequest("/rest/onboardings/register", "POST", {
      name: "John Doe",
      email: "john.doe@org.com",
      password: "password123",
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.status, "success");
    assert.strictEqual(res.data.data.user.role, "EMP");
    empId = res.data.data.user.id;
  });

  await t.test("EMP registration with non-org.com email should fail with 400", async () => {
    const res = await apiRequest("/rest/onboardings/register", "POST", {
      name: "John Doe",
      email: "john.doe@gmail.com",
      password: "password123",
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.status, "error");
  });

  await t.test("Duplicate email registration should fail with 409 Conflict", async () => {
    const res = await apiRequest("/rest/onboardings/register", "POST", {
      name: "John Duplicate",
      email: "john.doe@org.com",
      password: "password123",
    });
    assert.strictEqual(res.status, 409);
  });

  await t.test("Registering another employee to become RM later", async () => {
    const res = await apiRequest("/rest/onboardings/register", "POST", {
      name: "Manager Smith",
      email: "smith@org.com",
      password: "password123",
    });
    assert.strictEqual(res.status, 201);
    rmId = res.data.data.user.id;
  });

  await t.test("Registering another employee to become APE later", async () => {
    const res = await apiRequest("/rest/onboardings/register", "POST", {
      name: "AP Exec Alice",
      email: "alice@org.com",
      password: "password123",
    });
    assert.strictEqual(res.status, 201);
    apeId = res.data.data.user.id;
  });

  await t.test("CFO assigns RM role to Smith", async () => {
    const res = await apiRequest("/rest/roles/assign", "POST", {
      userId: rmId,
      role: "RM",
    }, cfoCookie);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.user.role, "RM");
  });

  await t.test("CFO assigns APE role to Alice", async () => {
    const res = await apiRequest("/rest/roles/assign", "POST", {
      userId: apeId,
      role: "APE",
    }, cfoCookie);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.user.role, "APE");
  });

  await t.test("EMP login should work and retrieve token cookie", async () => {
    const res = await apiRequest("/rest/onboardings/login", "POST", {
      email: "john.doe@org.com",
      password: "password123",
    });
    assert.strictEqual(res.status, 200);
    empCookie = res.setCookie.split(";")[0];
  });

  await t.test("RM login should work and retrieve token cookie", async () => {
    const res = await apiRequest("/rest/onboardings/login", "POST", {
      email: "smith@org.com",
      password: "password123",
    });
    assert.strictEqual(res.status, 200);
    rmCookie = res.setCookie.split(";")[0];
  });

  await t.test("APE login should work and retrieve token cookie", async () => {
    const res = await apiRequest("/rest/onboardings/login", "POST", {
      email: "alice@org.com",
      password: "password123",
    });
    assert.strictEqual(res.status, 200);
    apeCookie = res.setCookie.split(";")[0];
  });

  await t.test("CFO assigns employee to RM", async () => {
    const res = await apiRequest("/rest/employees/assign", "POST", {
      empUserId: empId,
      rmUserId: rmId,
    }, cfoCookie);
    assert.strictEqual(res.status, 200);
  });

  await t.test("Employee raising a reimbursement should succeed", async () => {
    const res = await apiRequest("/rest/reimbursements", "POST", {
      title: "Client Dinner",
      description: "Business dinner with clients",
      amount: 150.50,
    }, empCookie);
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.data.reimbursement.status, "PENDING");
    reimbursementId = res.data.data.reimbursement.id;
  });

  await t.test("Employee raising a reimbursement with negative amount should fail (Zod)", async () => {
    const res = await apiRequest("/rest/reimbursements", "POST", {
      title: "Invalid Dinner",
      description: "Negative amount",
      amount: -50.00,
    }, empCookie);
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.data.status, "error");
  });

  await t.test("RM lists pending reimbursements for subordinates (should show 1)", async () => {
    const res = await apiRequest("/rest/reimbursements", "GET", null, rmCookie);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.reimbursements.length, 1);
    assert.strictEqual(res.data.data.reimbursements[0].title, "Client Dinner");
  });

  await t.test("APE lists pending reimbursements (should be 0 because RM has not approved yet)", async () => {
    const res = await apiRequest("/rest/reimbursements", "GET", null, apeCookie);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.reimbursements.length, 0);
  });

  await t.test("APE approving before RM should fail with 409 Conflict", async () => {
    const res = await apiRequest("/rest/reimbursements", "PATCH", {
      userId: reimbursementId,
      status: "APPROVED",
    }, apeCookie);
    assert.strictEqual(res.status, 409);
  });

  await t.test("RM approves reimbursement", async () => {
    const res = await apiRequest("/rest/reimbursements", "PATCH", {
      userId: reimbursementId,
      status: "APPROVED",
    }, rmCookie);
    assert.strictEqual(res.status, 200);
  });

  await t.test("APE now lists pending reimbursements (should show 1)", async () => {
    const res = await apiRequest("/rest/reimbursements", "GET", null, apeCookie);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.reimbursements.length, 1);
  });

  await t.test("APE approves reimbursement (status flips to APPROVED)", async () => {
    const res = await apiRequest("/rest/reimbursements", "PATCH", {
      userId: reimbursementId,
      status: "APPROVED",
    }, apeCookie);
    assert.strictEqual(res.status, 200);
  });

  await t.test("EMP views their reimbursements list (status should now be APPROVED)", async () => {
    const res = await apiRequest("/rest/reimbursements", "GET", null, empCookie);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.reimbursements[0].status, "APPROVED");
  });

  await t.test("CFO lists approved reimbursements (should show 1)", async () => {
    const res = await apiRequest("/rest/reimbursements", "GET", null, cfoCookie);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.reimbursements.length, 1);
    assert.strictEqual(res.data.data.reimbursements[0].status, "APPROVED");
  });

  await t.test("Clean up server connections", async () => {
    server.close();
  });
});
