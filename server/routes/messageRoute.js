const pool = require("../config/db");
const { authToken } = require("../config/auth");
const express = require("express");

console.log('messages running');
const messageRouter = express.Router();

// Create a new message
messageRouter.post('/', authToken, async (req, res) => {
  try {
    const { message, group_id, user_id } = req.body;

    const newMessage = await pool.query(
      `INSERT INTO messages (message, group_id, user_id)
       VALUES ($1, $2, $3)
       RETURNING message, group_id, user_id, message_id`,
      [message, group_id, user_id]
    );

    res.status(200).json(newMessage.rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

// Load messages for a specific group
messageRouter.get('/:group_id', authToken, async (req, res) => {
  try {
    const { group_id } = req.params;

    const messages = await pool.query(
      `SELECT messages.*, Users.username
       FROM messages
       INNER JOIN Users ON messages.user_id = Users.user_id
       WHERE messages.group_id = $1
       ORDER BY messages.timestamp DESC`,
      [group_id]
    );

    res.status(200).json(messages.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

// Update a specific message
messageRouter.put('/:message_id', authToken, async (req, res) => {
  try {
    const { message_id } = req.params;
    const { message } = req.body;

    const updatedMessage = await pool.query(
      `UPDATE messages SET message = $1 WHERE message_id = $2 RETURNING *`,
      [message, message_id]
    );

    if (updatedMessage.rows.length === 0) {
      return res.status(404).send("Message not found");
    }

    res.status(200).json({ message: "Message updated successfully", updatedMessage: updatedMessage.rows[0] });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

// Delete a specific message
messageRouter.delete('/:message_id', authToken, async (req, res) => {
  try {
    const { message_id } = req.params;

    const deletedMessage = await pool.query(
      `DELETE FROM messages WHERE message_id = $1 RETURNING *`,
      [message_id]
    );

    if (deletedMessage.rows.length === 0) {
      return res.status(404).send("Message not found");
    }

    res.status(200).json({ message: "Message deleted successfully", deletedMessage: deletedMessage.rows[0] });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});
  module.exports = {
    messageRouter,
  };
  