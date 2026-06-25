process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "testsecretkeytestsecretkeytestsecretkey";

const { app, server } = require("../src/index");

async function run() {
  const address = server.address();
  const url = `http://localhost:${address.port}/rest/onboardings/register`;
  
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "John Doe",
      email: "john.doe@gmail.com", // should trigger 400
      password: "password123"
    })
  });
  
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Headers:", res.headers.get("content-type"));
  console.log("Body:", text);
  
  server.close();
}

run();
