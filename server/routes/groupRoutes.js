const express = require("express");
const pool = require("../config/db");
const groupRouter = express.Router();

//request join group
groupRouter.post("/groups/:groupId/request", async (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body;
  try {
    await pool.query(
      "INSERT INTO GroupMemberships (group_id, user_id, role) VALUES ($1, $2, $3)",
      [groupId, userId, "pending"]
    );
    res.status(200).json({ message: "Request sent." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 'accept' or 'reject' by admin
groupRouter.patch("/groups/:groupId/members/:userId", async (req, res) => {
  const { groupId, userId } = req.params;
  const { action } = req.body;

  try {
    if (action === "accept") {
      await pool.query(
        "UPDATE GroupMemberships SET role = $1 WHERE group_id = $2 AND user_id = $3",
        ["member", groupId, userId]
      );
      res.status(200).json({ message: "Request accepted." });
    } else if (action === "reject") {
      await pool.query(
        "DELETE FROM GroupMemberships WHERE group_id = $1 AND user_id = $2",
        [groupId, userId]
      );
      res.status(200).json({ message: "Request rejected." });
    } else {
      res.status(400).json({ error: "Invalid action." });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Leave group by nember
groupRouter.post("/groups/:groupId/leave", async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.id;

  try {
    await pool.query(
      "DELETE FROM GroupMemberships WHERE group_id = $1 AND user_id = $2",
      [groupId, userId]
    );
    res.status(200).send({ message: "Successfully left the group" });
  } catch (error) {
    res.status(500).send({ error: "Error leaving the group" });
  }
});

// Remove the member by admin
groupRouter.delete("/groups/:groupId/members/:userId", async (req, res) => {
  const { groupId, userId } = req.params;
  const requesterId = req.body.requesterId; // Admin's ID from the request body or token

  try {
    // Check if the requester is the group admin
    const group = await pool.query(
      "SELECT owner_id FROM Groups WHERE group_id = $1",
      [groupId]
    );

    if (group.rows[0].owner_id !== requesterId) {
      return res
        .status(403)
        .json({ error: "Only the group owner can remove members." });
    }
    await pool.query(
      "DELETE FROM GroupMemberships WHERE group_id = $1 AND user_id = $2",
      [groupId, userId]
    );

    res.status(200).json({ message: "Member removed from the group." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = {
  groupRouter,
};
