const pool = require("../config/db");
const { authToken } = require("../config/auth");
const express = require("express");

console.log('review router executed');

const reviewRouter = express.Router();


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
reviewRouter.get('/:movie_id', authToken, async (req, res) => {
  try {
    const { movie_id } = req.params;

    const reviews = await db.query(
      `SELECT movie_reviews.*, Users.username
      FROM movie_reviews
      INNER JOIN Users ON movie_reviews.user_id = Users.user_id
      WHERE movie_reviews.movie_id = $1
      ORDER BY movie_reviews.timestamp DESC`,
      [movie_id]
    );

    res.status(200).json(reviews.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

reviewRouter.put('/:review_id', authToken, async (req, res) => {
  try {
    const { review_id } = req.params;
    const { review } = req.body;

    // Update the comment with the specified comment_id
    const updatedReview = await db.query(
      `UPDATE movie_reviews SET review = $1 WHERE review_id = $2 RETURNING *`,
      [review, review_id]
    );

    if (updatedComment.rows.length === 0) {
      return res.status(404).send("Review not found");
    }

    res.status(200).json({ message: "Review updated successfully", updatedReview: updatedReview.rows[0] });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

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
  
  // Get reviews for a specific movie
  reviewRouter.get('/:movie_id', authToken, async (req, res) => {
    try {
      const { movie_id } = req.params;
  
      const reviews = await db.query(
        `SELECT movie_reviews.*, Users.username
        FROM movie_reviews
        INNER JOIN Users ON movie_reviews.user_id = Users.user_id
        WHERE movie_reviews.movie_id = $1
        ORDER BY movie_reviews.timestamp DESC`,
        [movie_id]
      );
  
      res.status(200).json(reviews.rows);
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server Error");
    }
  });
  
  
  reviewRouter.delete('/:review_id', authToken, async (req, res) => {
    try {
      const { review_id } = req.params;
  
      // Delete the review
      const deletedReview = await db.query(
        `DELETE FROM movie_reviews WHERE review_id = $1 RETURNING *`,
        [review_id]
      );
  
      if (deletedReview.rows.length === 0) {
        return res.status(404).send("Review not found");
      }
  
      res.status(200).json({ message: "Review deleted successfully", deletedReview: deletedReview.rows[0] });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server Error");
    }
  });
  
  reviewRouter.put('/:review_id', authToken, async (req, res) => {
    try {
      const { review_id } = req.params;
      const { review } = req.body;
  
      // Update the review as authenticated user on specific user_id
      const updatedReview = await db.query(
        `UPDATE movie_reviews SET review = $1 WHERE review_id = $2 RETURNING *`,
        [review, review_id]
      );
  
      if (updatedReview.rows.length === 0) {
        return res.status(404).send("Review not found");
      }
  
      res.status(200).json({ message: "Review updated successfully", updatedReview: updatedReview.rows[0] });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server Error");
    }
  });

  module.exports = {
    reviewRouter,
  };
  