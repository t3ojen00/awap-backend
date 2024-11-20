const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const db = require("./db"); // Import db with pool and query
const jwt = require("jsonwebtoken");
const { hash } = bcrypt;
const { sign } = jwt;

const getToken = (email) => {
  try {
    if (!process.env.JWT_SECRET_KEY) {
      throw new Error("JWT_SECRET_KEY is not defined in the environment.");
    }
    return sign({ user: email }, process.env.JWT_SECRET_KEY, {
      expiresIn: "15h",
    });
  } catch (error) {
    console.error("Error generating token:", error);
    return null;
  }
};

const insertTestUser = async (email, password) => {
  try {
    const hashedPassword = await new Promise((resolve, reject) => {
      hash(password, 10, (err, hash) => {
        if (err) return reject(err);
        resolve(hash);
      });
    });

    // Insert the user and return the userId
    const result = await db.pool.query(
      "INSERT INTO Users (email, password_hash) VALUES ($1, $2) RETURNING user_id",
      [email, hashedPassword]
    );

    const userId = result.rows[0].user_id;
    //console.log("Test user inserted successfully, userId:", userId);

    return userId; // Return the userId to be used in tests
  } catch (error) {
    console.error("Error inserting test user:", error);
    throw error;
  }
};

// Export functions for testing
module.exports = { insertTestUser, getToken };
