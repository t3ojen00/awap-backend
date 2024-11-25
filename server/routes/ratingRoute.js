const pool = require("../config/db");
const { authToken } = require("../config/auth");
const express = require("express");

console.log('rating router executed');

const ratingRouter = express.Router();

// post ratings and change them
ratingRouter.post('/', authToken, async (req, res) => {
  try {
    const { rating, movie_id, user_id } = req.body;

    const existingRating = await db.query(
      `SELECT * FROM movie_rating WHERE movie_id = $1 AND user_id = $2`,
      [movie_id, user_id]
    );

    if (existingRating.rows.length === 0) {
      const newRating = await db.query(
        `INSERT INTO movie_rating (rating, movie_id, user_id)
           VALUES ($1, $2, $3)
           RETURNING rating, movie_id, user_id`,
        [rating, movie_id, user_id]
      );
      res.status(200).send(newRating.rows);
    } else {
      const updatedRating = await db.query(
        `UPDATE movie_rating
           SET rating = $1
           WHERE movie_id = $2 AND user_id = $3
           RETURNING rating, movie_id, user_id`,
        [rating, movie_id, user_id]
      );
      res.status(200).send(updatedRating.rows);
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

  // get ratings loaded
  ratingRouter.get('/:movie_id', authToken, async (req, res) => {
    try {
      const { movie_id } = req.params;
  
      const ratings = await db.query(
        `SELECT * FROM movie_rating WHERE movie_id = $1`,
        [movie_id]
      );
  
      res.status(200).json(ratings.rows);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server Error");
    }
  });

//get average rating for a film
  ratingRouter.get('/average/:movie_id', authToken, async (req, res) => {
    try {
      const { movie_id } = req.params;
  
      const ratings = await db.query(
        `SELECT ROUND(AVG(rating)) AS average_rating, COUNT(*) AS amount_of_ratings 
        FROM movie_rating
        WHERE movie_id = $1`,
        [movie_id]
      );
      res.status(200).json({ averageRating: ratings.rows[0].average_rating, amountOfRatings: ratings.rows[0].amount_of_ratings });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server Error");
    }
  })

module.exports = {
    ratingRouter,
  };