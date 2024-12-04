const express = require("express");
const pool = require("../config/db"); // Ensure you have the database pool correctly configured in `../config/db`
const { authToken } = require("../config/auth");
const favouriteRouter = express.Router();
favouriteRouter.use(authToken);
console.log("favourite router running");

favouriteRouter.post("/add", async (req, res) => {
  const { user_id } = req.user;
  const { movie_id } = req.body;

  if (!user_id || !movie_id) {
    return res.status(400).json({ error: "movie_id is required" });
  }

  try {
    const addFavouriteQuery = `
            INSERT INTO Favourites (user_id, movie_id)
            VALUES ($1, $2)
            ON CONFLICT (user_id, movie_id) DO NOTHING;
        `;
    await pool.query(addFavouriteQuery, [user_id, movie_id]);

    res.status(201).json({ message: "Movie added to favorites successfully" });
  } catch (error) {
    console.error("Error adding movie to favorites:", error);
    res.status(500).json({ error: "Failed to add movie to favorites" });
  }
});

// Unfavourite a movie
favouriteRouter.delete("/remove", async (req, res) => {
  const { user_id } = req.user;
  const { movie_id } = req.body;

  if (!user_id || !movie_id) {
    return res.status(400).json({ error: "user_id and movie_id are required" });
  }

  try {
    const query = `
            DELETE FROM Favourites
            WHERE user_id = $1 AND movie_id = $2;
        `;
    await pool.query(query, [user_id, movie_id]);
    res
      .status(200)
      .json({ message: "Movie removed from favorites successfully" });
  } catch (error) {
    console.error("Error removing from favorites:", error);
    res.status(500).json({ error: "Failed to remove movie from favorites" });
  }
});

// Get all favourite movies for a user
favouriteRouter.get("/", async (req, res) => {
  const { user_id } = req.user;
  try {
    const query = `
           SELECT id,movie_id from Favourites where user_id = $1
        `;
    const { rows } = await pool.query(query, [user_id]);
    res.status(200).json({ favorites: rows });
  } catch (error) {
    console.error("Error retrieving favorite movies:", error);
    res.status(500).json({ error: "Failed to retrieve favorite movies" });
  }
});

module.exports = { favouriteRouter };
