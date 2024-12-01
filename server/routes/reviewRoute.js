const pool = require("../config/db");
const { authToken } = require("../config/auth");
const express = require("express");
const axios = require('axios'); // Fetching Finnkino API with axios
const xml2js = require('xml2js'); // Library to parse XML data

console.log('review router executed');

const reviewRouter = express.Router();
const MOVIE_API_BASE_URL = "https://www.finnkino.fi/xml/Schedule/";


  reviewRouter.post('/', authToken, async (req, res) => {
  try {
    const { review, movie_id, user_id, movie_name } = req.body;

    // Insert the new review
    const newReview = await db.query(
      `INSERT INTO movie_reviews (review, movie_id, user_id, movie_name)
         VALUES ($1, $2, $3, $4)
         RETURNING review, movie_id, user_id, movie_name`,
      [review, movie_id, user_id, movie_name]
    );
    res.status(200).send(newReview.rows);

  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

// Get reviews for a specific movies
reviewRouter.post("/", authToken, async (req, res) => {
  try {
    const { review, movie_id, user_id } = req.body;

    // Check if the movie exists via the movie API
    const movieResponse = await axios.get(`${MOVIE_API_BASE_URL}/${movie_id}`);
    if (!movieResponse.data) {
      return res.status(404).json({ error: "Movie not found" });
    }

    // Insert the new review
    const newReview = await pool.query(
      `INSERT INTO movie_reviews (review, movie_id, user_id)
       VALUES ($1, $2, $3)
       RETURNING review, movie_id, user_id`,
      [review, movie_id, user_id]
    );
    res.status(201).json(newReview.rows[0]);
  } catch (error) {
    console.error("Error posting review:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET all reviews for a specific movie
reviewRouter.get("/:movie_id", authToken, async (req, res) => {
  try {
    const { movie_id } = req.params;

    // Check if the movie exists via the movie API
    const movieResponse = await axios.get(`${MOVIE_API_BASE_URL}/${movie_id}`);
    if (!movieResponse.data) {
      return res.status(404).json({ error: "Movie not found" });
    }

    // Fetch reviews for the movie
    const reviews = await pool.query(
      `SELECT movie_reviews.*, Users.username
       FROM movie_reviews
       INNER JOIN Users ON movie_reviews.user_id = Users.user_id
       WHERE movie_reviews.movie_id = $1
       ORDER BY movie_reviews.timestamp DESC`,
      [movie_id]
    );
    res.status(200).json(reviews.rows);
  } catch (error) {
    console.error("Error fetching reviews:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE a review
reviewRouter.delete("/:review_id", authToken, async (req, res) => {
  try {
    const { review_id } = req.params;

    // Delete the review
    const deletedReview = await pool.query(
      `DELETE FROM movie_reviews WHERE review_id = $1 RETURNING *`,
      [review_id]
    );

    if (deletedReview.rows.length === 0) {
      return res.status(404).json({ error: "Review not found" });
    }
    res.status(200).json({ message: "Review deleted successfully", deletedReview: deletedReview.rows[0] });
  } catch (error) {
    console.error("Error deleting review:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

  module.exports = {
    reviewRouter,
  };
  