const express = require("express");
const { authToken } = require("../config/auth");
const { User } = require("../dto/UserClass");
const bcrypt = require("bcrypt");
const db = require("../config/db");
const jwt = require("jsonwebtoken"); // H add
const { hash, compare } = require("bcrypt"); //H add
const pool = require("../config/db");

console.log("user router executed");
const userRouter = express.Router();

// get the user id to the db and use the auth.js to keep the same user logged in
userRouter.get("/:user_id", authToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).send({ error: "User ID must be a number" });
    }

    const userInfo = await getUserInformation(userId);

    if (userInfo.length === 0) {
      return res.status(404).send({ error: "User not found" });
    }

    res.json(userInfo[0]);
  } catch (error) {
    console.error("Failed to get user information:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

//registeration to the site
userRouter.post("/registration", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send({ error: "Email and password are required" });
    }

    const hash = await bcrypt.hash(password, 10);

    const sql =
      "INSERT INTO Users (email, password_hash) VALUES ($1, $2) RETURNING user_id";
    const result = await db.query(sql, [email, hash]);

    res.status(200).json({ id: result.rows[0].user_id });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//logout//H
userRouter.post("/logout", authToken, (req, res) => {
  try {
    return res.status(200).json({ message: "Successfully logged out" });
  } catch (error) {
    console.error("Error during logout:", error);
    return res.status(500).json({ error: "Logout failed" });
  }
});

//delete//H
userRouter.delete("/delete/:id", authToken, (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  db.query("DELETE FROM Users WHERE user_id = $1", [id], (error, result) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ id: id });
  });
});

// Login route
userRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user exists
    const userQuery = "SELECT * FROM Users WHERE email = $1";
    const { rows } = await pool.query(userQuery, [email]);
    const user = rows[0];

    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Compare the password hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { userId: user.user_id, email: user.email },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "15h" } // Token expiration
    );

    // Send the token to the client
    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


module.exports = {
  userRouter,
};
