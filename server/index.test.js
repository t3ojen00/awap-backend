const { expect } = require("chai");
const fetch = require("node-fetch");
const { insertTestUser, deleteTestUser, getToken } = require("./config/test");

const base_url = process.env.BASE_URL || "http://localhost:3000/";

describe("POST /users/registration", () => {
  const email = "test_registration@example.com";
  const user_name = "test_registration";
  const password = "Test123";

  // after(async () => {
  //   await deleteTestUser(email);
  // });

  it("should register with valid email and password", async () => {
    const response = await fetch(base_url + "users/registration", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        user_name,
        password,
      }),
    });

    const data = await response.json();
    expect(response.status).to.equal(201);
    expect(data).to.be.an("object");
    expect(data).to.have.property("user_id").that.is.a("number");
  });

  it("should not register a user with a password that does not meet complexity requirements", async () => {
    const weakPassword = "password";
    const response = await fetch(base_url + "users/registration", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "weak_password@example.com",
        user_name: "weak_password",
        password: weakPassword,
      }),
    });

    const data = await response.json();
    expect(response.status).to.equal(400);
    expect(data)
      .to.have.property("error")
      .that.equals(
        "Password must contain at least one capital letter and one number."
      );
  });
});

describe("POST /users/login", () => {
  const email = "test_login@example.com";
  const user_name = "test_login";
  const password = "Test123";

  insertTestUser(email, user_name, password);

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
  const user_name = "test_logout";
  const password = "Test123";

  insertTestUser(email, user_name, password);
  const token = `Bearer ${getToken(email)}`;

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
  const email = "test_delete@example.com";
  const user_name = "test_delete";
  const password = "Test123";

  let token;
  let userId;

  insertTestUser(email, user_name, password).then((id) => {
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
