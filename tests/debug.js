process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "testsecretkeytestsecretkeytestsecretkey";

const { app, server } = require("../src/index");
const { db } = require("../src/db/db");
const { users } = require("../src/db/schema");
const bcrypt = require("bcryptjs");
const onboardingRepository = require("../src/modules/onboarding/onboarding.repository");

async function debug() {
  const passwordHash = await bcrypt.hash("CFO#ORG@April2026", 10);
  console.log("Seeding CFO with hash:", passwordHash);
  
  const [seeded] = await db.insert(users).values({
    name: "Chief Financial Officer",
    email: "cfo@org.com",
    passwordHash: passwordHash,
    role: "CFO",
  });
  console.log("Seeded user record in DB:", seeded);

  const foundUser = await onboardingRepository.findUserByEmail("cfo@org.com");
  console.log("User found in repo lookup:", foundUser);

  if (foundUser) {
    const match = await bcrypt.compare("CFO#ORG@April2026", foundUser.passwordHash);
    console.log("Bcrypt compare result for correct password:", match);
  }

  const address = server.address();
  const loginUrl = `http://localhost:${address.port}/rest/onboardings/login`;
  
  const res = await fetch(loginUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "cfo@org.com", password: "CFO#ORG@April2026" })
  });
  
  const data = await res.json();
  console.log("Login HTTP Status:", res.status);
  console.log("Login HTTP Data:", data);

  server.close();
}

debug();
