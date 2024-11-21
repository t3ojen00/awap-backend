require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database:
    process.env.NODE_ENV === "development"
      ? process.env.DB_DATABASE
      : process.env.TEST_DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

module.exports.query = (text, params, callback) => {
  return pool.query(text, params, callback);
};
