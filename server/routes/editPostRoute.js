const express = require('express');
const db = require('../config/db.js'); // database connection
const editPostRouter = express.Router();

// database connection may need to still be modified
// used "database: process.env.DB_DATABASE,"" last time 
// and commented out 
/*  "process.env.NODE_ENV === "development"
      ? process.env.DB_DATABASE
      : process.env.TEST_DB_DATABASE, "
*/
// in the db.js file

// fetch all posts based on group_id
editPostRouter.get('/:id', async (req, res) => {
    // get the group_id
    const { id } = req.params
    try {
      const query = `SELECT * FROM messages WHERE group_id = $1`;
      const { rows } = await db.query(query, [id]);
      return res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching posts:', error.message);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  }
);
  
// edit a specific post
editPostRouter.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { message } = req.body;
  
    if (!message) {
      return res.status(400).json({ message: 'Content is required.' });
    }
  
    try {
      const query = `UPDATE messages SET messages = $1, timestamp = CURRENT_TIMESTAMP WHERE message_id = $2 RETURNING *;`;
      const { rows } = await db.query(query, [content, id]);
  
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Post not found.' });
      }
  
      return res.status(200).json({
        message: 'Post updated successfully.',
        post: rows[0],
      });
    } catch (error) {
      console.error('Error updating post:', error.message);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  }
);
  
// delete a specific post
editPostRouter.delete('/:id', async (req, res) => {
    // we get the id from the request parameters
    const { id } = req.params;

    try {
      // we delete a post with that id
      const query = `DELETE FROM messages WHERE message_id = $1 RETURNING *`;
      const { rows } = await db.query(query, [id]);

      // if post isn't found, send an error message
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Post not found.' });
      }
  
      // if post is found, send a success message
      return res.status(200).json({
        message: `Post with ID ${id} deleted successfully.`,
      });
    } catch (error) {
      console.error('Error deleting post:', error.message);
      return res.status(500).json({ message: 'Internal server error.' });
    }
  }
);
  

module.exports = editPostRouter