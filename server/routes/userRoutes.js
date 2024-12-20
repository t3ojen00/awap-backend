const express = require("express");
const { authToken } = require("../config/auth");
const { User } = require("../dto/UserClass");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken"); // H add
const { hash, compare } = require("bcrypt"); //H add
const pool = require("../config/db");

console.log("user router executed");
const userRouter = express.Router();

// get the user id to the db and use the auth.js to keep the same user logged in
userRouter.get("/:user_id", authToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.user_id, 10); //user_id
    if (isNaN(userId)) {
      return res.status(400).send({ error: "User ID must be a number" });
    }

    // const userInfo = await getUserInformation(userId);

    // if (userInfo.length === 0) {
    //   return res.status(404).send({ error: "User not found" });
    // }

    // res.json(userInfo[0]);

    //Dont have getUserInformation, cannot await, how about this way:
    const result = await pool.query("SELECT * FROM users WHERE user_id = $1", [
      userId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).send({ error: "User not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Failed to get user information:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

//registeration to the site
// userRouter.post("/registration", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).send({ error: "Email and password are required" });
//     }
//     //query to check if the email already exists

//     const existingEmail = "SELECT * FROM Users WHERE email = $1";
//     const { rows } = await pool.query(existingEmail, [email]);

//     if (rows.length > 0) {
//       return res.status(400).json({ error: "Email already exists" });
//     }

//     // Password need least one capital letter and one number-H add
//     const passwordRequried = /^(?=.*[A-Z])(?=.*\d).+$/;
//     if (!passwordRequried.test(password)) {
//       return res.status(400).json({
//         error:
//           "Password must contain at least one capital letter and one number.",
//       });
//     }

//     const hash = await bcrypt.hash(password, 10);

//     const sql =
//       "INSERT INTO Users (email, password_hash) VALUES ($1, $2) RETURNING user_id";
//     const result = await pool.query(sql, [email, hash]);

//     res.status(200).json({ id: result.rows[0].user_id });
//   } catch (error) {
//     console.error("Error during registration:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

//add user_name
userRouter.post("/registration", async (req, res) => {
  try {
    const { email, user_name, password } = req.body;
    if (!email || !user_name || !password) {
      return res
        .status(400)
        .json({ error: "Email, username, and password are required." });
    }
    // Check if email or username already exists
    const userCheckQuery =
      "SELECT email, user_name FROM Users WHERE email = $1 OR user_name = $2";
    const { rows: existingUsers } = await pool.query(userCheckQuery, [
      email,
      user_name,
    ]);
    if (existingUsers.length > 0) {
      const conflict = existingUsers[0];
      if (conflict.email === email) {
        return res.status(400).json({ error: "Email already exists." });
      }
      if (conflict.user_name === user_name) {
        return res.status(400).json({ error: "Username already exists." });
      }
    }
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).+$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error:
          "Password must contain at least one capital letter and one number.",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const insertUserQuery =
      "INSERT INTO Users (email, user_name, password_hash) VALUES ($1, $2, $3) RETURNING user_id";
    const { rows: newUser } = await pool.query(insertUserQuery, [
      email,
      user_name,
      hashedPassword,
    ]);
    // Return success response
    res.status(201).json({
      message: "User registered successfully.",
      user_id: newUser[0].user_id,
    });
  } catch (error) {
    console.error("Error during registration:", error);

    if (error.detail.includes("email")) {
      return res.status(400).json({ error: "Email already exists." });
    }
    if (error.detail.includes("user_name")) {
      return res.status(400).json({ error: "Username already exists." });
    }

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

  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid user ID." });
  }

  pool.query(
    "DELETE FROM Users WHERE user_id = $1 RETURNING *",
    [id],
    (error, result) => {
      if (error) {
        return res.status(500).json({ error: error.message });
      }

      // if (result.rowCount === 0) {
      //   return res.status(404).json({ message: "User not found." });
      // }

      return res.status(200).json({ message: "User deleted successfully" });
    }
  );
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
    res.status(200).json({
      message: "Login successful",
      token,
      userId: user.user_id,
      email: user.email,
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = {
  userRouter,
};
