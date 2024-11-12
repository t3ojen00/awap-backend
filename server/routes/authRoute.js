const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const authRouter = express.Router();

console.log("authRouter executed");
// Login route
authRouter.post("/login", async (req, res) => {
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

module.exports = { authRouter };
