const pool = require("../config/db");
const { authToken } = require("../config/auth");
const express = require("express");

console.log('rating router executed');

const ratingRouter = express.Router();

// Post or update a rating
ratingRouter.post('/', authToken, async (req, res) => {
  try {
    const { rating, movie_id, user_id } = req.body;

    // Check if movie exists in external API
    const movieResponse = await axios.get(`http://movies-api-url.com/movies/${movie_id}`);
    if (!movieResponse.data) {
      return res.status(404).send("Movie not found in the external API");
    }

    // Check if a rating already exists
    const existingRating = await pool.query(
      `SELECT * FROM movie_rating WHERE movie_id = $1 AND user_id = $2`,
      [movie_id, user_id]
    );

    if (existingRating.rows.length === 0) {
      // Add a new rating
      const newRating = await pool.query(
        `INSERT INTO movie_rating (rating, movie_id, user_id)
           VALUES ($1, $2, $3)
           RETURNING rating, movie_id, user_id`,
        [rating, movie_id, user_id]
      );
      res.status(200).json(newRating.rows[0]);
    } else {
      // Update the existing rating
      const updatedRating = await pool.query(
        `UPDATE movie_rating
           SET rating = $1
           WHERE movie_id = $2 AND user_id = $3
           RETURNING rating, movie_id, user_id`,
        [rating, movie_id, user_id]
      );
      res.status(200).json(updatedRating.rows[0]);
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

// Get ratings for a movie
ratingRouter.get('/:movie_id', authToken, async (req, res) => {
  try {
    const { movie_id } = req.params;

    // Fetch ratings from the database
    const ratings = await pool.query(
      `SELECT * FROM movie_rating WHERE movie_id = $1`,
      [movie_id]
    );

    if (ratings.rows.length === 0) {
      return res.status(404).send("No ratings found for this movie");
    }

    res.status(200).json(ratings.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

// Get average rating for a movie
ratingRouter.get('/average/:movie_id', authToken, async (req, res) => {
  try {
    const { movie_id } = req.params;

    // Fetch average rating from the database
    const ratings = await pool.query(
      `SELECT ROUND(AVG(rating)) AS average_rating, COUNT(*) AS amount_of_ratings 
        FROM movie_rating
        WHERE movie_id = $1`,
      [movie_id]
    );

    if (ratings.rows.length === 0) {
      return res.status(404).send("No ratings found for this movie");
    }

    res.status(200).json({
      averageRating: ratings.rows[0].average_rating,
      amountOfRatings: ratings.rows[0].amount_of_ratings
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = {
    ratingRouter,
  };