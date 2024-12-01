const pool = require("../config/db");
const { authToken } = require("../config/auth");
const axios = require('axios'); // Fetching Finnkino API with axios
const xml2js = require('xml2js'); // Library to parse XML data
const express = require("express");

console.log('rating router executed');

const ratingRouter = express.Router();
const MOVIE_API_BASE_URL = "https://www.finnkino.fi/xml/Schedule/";

// Post or update a rating
ratingRouter.post("/", authToken, async (req, res) => {
  try {
    const { rating, movie_id, user_id } = req.body;

    // Check if the movie exists via the movie API
    const movieResponse = await axios.get(`${MOVIE_API_BASE_URL}/${movie_id}`);
    if (!movieResponse.data) {
      return res.status(404).json({ error: "Movie not found" });
    }

    // Check if the user already rated the movie
    const existingRating = await pool.query(
      `SELECT * FROM movie_rating WHERE movie_id = $1 AND user_id = $2`,
      [movie_id, user_id]
    );

    if (existingRating.rows.length === 0) {
      // Insert a new rating
      const newRating = await pool.query(
        `INSERT INTO movie_rating (rating, movie_id, user_id)
         VALUES ($1, $2, $3)
         RETURNING rating, movie_id, user_id`,
        [rating, movie_id, user_id]
      );
      return res.status(201).json(newRating.rows[0]);
    } else {
      // Update the existing rating
      const updatedRating = await pool.query(
        `UPDATE movie_rating
         SET rating = $1
         WHERE movie_id = $2 AND user_id = $3
         RETURNING rating, movie_id, user_id`,
        [rating, movie_id, user_id]
      );
      return res.status(200).json(updatedRating.rows[0]);
    }
  } catch (error) {
    console.error("Error processing rating:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET all ratings for a specific movie
ratingRouter.get("/:movie_id", authToken, async (req, res) => {
  try {
    const { movie_id } = req.params;

    // Check if the movie exists via the movie API
    const movieResponse = await axios.get(`${MOVIE_API_BASE_URL}/${movie_id}`);
    if (!movieResponse.data) {
      return res.status(404).json({ error: "Movie not found" });
    }

    // Fetch ratings for the movie
    const ratings = await pool.query(
      `SELECT * FROM movie_rating WHERE movie_id = $1`,
      [movie_id]
    );
    res.status(200).json(ratings.rows);
  } catch (error) {
    console.error("Error fetching ratings:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET the average rating for a specific movie
ratingRouter.get("/average/:movie_id", authToken, async (req, res) => {
  try {
    const { movie_id } = req.params;

    // Check if the movie exists via the movie API
    const movieResponse = await axios.get(`${MOVIE_API_BASE_URL}/${movie_id}`);
    if (!movieResponse.data) {
      return res.status(404).json({ error: "Movie not found" });
    }

    // Fetch the average rating
    const averageRating = await pool.query(
      `SELECT ROUND(AVG(rating), 1) AS average_rating, COUNT(*) AS amount_of_ratings 
       FROM movie_rating
       WHERE movie_id = $1`,
      [movie_id]
    );
    res.status(200).json(averageRating.rows[0]);
  } catch (error) {
    console.error("Error calculating average rating:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = {
    ratingRouter,
  };