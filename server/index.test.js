const { expect } = require("chai");
const axios = require("axios");
const { insertTestUser, getToken } = require("./config/test.js");

const base_url = "http://localhost:3000/";

describe("POST /registration", () => {
  const email = "test_registration@example.com";
  const password = "Test123";

  it("should register with valid email and password", async () => {
    const response = await fetch(base_url + "users/registration", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email, password: password }),
    });

    const data = await response.json();

    expect(response.status).to.equal(200);
    expect(data).to.be.an("object");
    expect(data).to.have.property("id");
    expect(data.id).to.be.a("number");
  });

  it("should not register a user with a password that does not meet complexity requirements", async () => {
    const invalidPasswordEmail = "test_invalid@example.com";
    const invalidPassword = "invalidpassword";

    const response = await fetch(base_url + "users/registration", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: invalidPasswordEmail,
        password: invalidPassword,
      }),
    });

    const data = await response.json();

    expect(response.status).to.equal(400);

    expect(data).to.be.an("object");
    expect(data).to.have.property("error");
    expect(data.error).to.equal(
      "Password must contain at least one capital letter and one number."
    );
  });
});

describe("POST /users/login", () => {
  const email = "test_login@example.com";
  const password = "Test123";

  // Ensure the test user is inserted before tests
  insertTestUser(email, password);

  // before(async () => {
  //   insertTestUser(email, password);
  // });

  it("should login with valid credentials", async () => {
    const response = await fetch(base_url + "users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    expect(response.status).to.equal(200);
    expect(data).to.be.an("object");
    expect(data).to.include.all.keys("userId", "email", "token");
    expect(data.email).to.equal(email);
  });
});

describe("POST /users/logout", () => {
  const email = "test_logout@example.com";
  const password = "Test123";

  insertTestUser(email, password);
  const token = `Bearer ${getToken(email)}`;

  // let token;
  // before(async () => {
  //   insertTestUser(email, password);
  //   token = `Bearer ${getToken(email)}`;
  // });

  it("should log out successfully with a valid token", async () => {
    const response = await fetch(base_url + "users/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token, // Token now has the correct format
      },
    });

    const data = await response.json();
    expect(response.status).to.equal(200);
    expect(data).to.be.an("object");
    expect(data)
      .to.have.property("message")
      .that.equals("Successfully logged out");
  });

  it("should fail to log out with an invalid token", async () => {
    const response = await fetch(base_url + "users/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer invalidtoken",
      },
    });

    const data = await response.json();
    expect(response.status).to.equal(403);
    expect(data).to.have.property("message").that.equals("Invalid token.");
  });
});

describe("DELETE /users/delete/:userId", () => {
  const email = "test_delete22@example.com";
  const password = "Test123";

  let token;
  let userId;

  insertTestUser(email, password).then((id) => {
    userId = id; // Set the userId
    if (!userId) {
      throw new Error(`User not found for email: ${email}`);
    }
    // Set token
    token = `Bearer ${getToken(email)}`;
  });

  it("should delete the authenticated user", async () => {
    const response = await fetch(`${base_url}users/delete/${userId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });
    const data = await response.json();
    expect(response.status).to.equal(200);
    expect(data)
      .to.have.property("message")
      .that.equals("User deleted successfully");
  });

  it("should not delete a user with SQL injection", async () => {
    const response = await fetch(base_url + "users/delete/id=0 or id > 0", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });
    const data = await response.json();
    expect(response.status).to.equal(400);
    expect(data).to.have.property("message").that.equals("Invalid user ID.");
  });

  it("should fail to delete with an invalid token", async () => {
    const response = await fetch(base_url + "users/delete/1", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer invalidtoken", // Invalid token
      },
    });
    const data = await response.json();
    expect(response.status).to.equal(403);
    expect(data).to.have.property("message").that.equals("Invalid token.");
  });
});
