const express = require("express");
const pool = require("../config/db");
const groupRouter = express.Router();
const { authToken } = require("../config/auth");

//create group
groupRouter.post("/", authToken, async (req, res) => {
  const { group_name } = req.body;
  const userId = req.user.user_id; // Get user ID from auth token

  try {
    const groupResult = await pool.query(
      `INSERT INTO Groups (group_name, owner_id) VALUES ($1, $2) RETURNING group_id`,
      [group_name, userId]
    );

    const groupId = groupResult.rows[0].group_id;

    // Add the creator to GroupMemberships as an admin
    await pool.query(
      `INSERT INTO GroupMemberships (group_id, user_id, role, status) VALUES ($1, $2, $3, $4)`,
      [groupId, userId, "admin", "accepted"]
    );

    res.status(201).json({ message: "Group created successfully", groupId });
  } catch (err) {
    console.error("Error creating group:", err);
    res.status(500).json({ error: "Failed to create group." });
  }
});

// *** ROUTE: List all groups ***
groupRouter.get("/all", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        g.group_id, 
        g.group_name, 
        g.owner_id, 
        u.email AS owner_name, 
        g.created_at
      FROM groups g
      JOIN users u ON g.owner_id = u.user_id
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//get data Idgroup
groupRouter.get("/all/:groupId", async (req, res) => {
  const { groupId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT g.group_name, g.created_at, u.user_id AS admin_id, u.email AS admin_email
      FROM Groups g
      JOIN Users u ON g.owner_id = u.user_id
      WHERE g.group_id = $1
      `,
      [groupId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Group not found." });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching group details:", err);
    res.status(500).json({ error: "Failed to fetch group details." });
  }
});

//delete group
groupRouter.delete("/delete/:id", authToken, async (req, res) => {
  const { id } = req.params;
  const owner_id = req.user.user_id; // Extracted from token
  // console.log("Owner ID from token:", owner_id);
  try {
    const result = await pool.query(
      "SELECT * FROM groups WHERE group_id = $1 AND owner_id = $2",
      [id, owner_id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "Group not found or you're not the owner." });
    }
    await pool.query("DELETE FROM groups WHERE group_id = $1", [id]);
    res.status(200).json({ message: "Group deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

groupRouter.post("/:groupId/request", authToken, async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.user_id;

  try {
    const existingMembership = await pool.query(
      "SELECT * FROM GroupMemberships WHERE group_id = $1 AND user_id = $2",
      [groupId, userId]
    );

    if (existingMembership.rows.length > 0) {
      return res.status(400).json({
        error: "You are already part of this group or have a pending request.",
      });
    }

    await pool.query(
      "INSERT INTO GroupMemberships (group_id, user_id, role, status) VALUES ($1, $2, $3, $4)",
      [groupId, userId, "member", "pending"]
    );

    res.status(200).json({
      message: "Request to join the group has been successfully sent.",
    });
  } catch (err) {
    console.error("Error requesting to join group:", err);
    res.status(500).json({
      error:
        "Failed to send request to join the group. Please try again later.",
    });
  }
});

// Leave a group
groupRouter.post("/:groupId/leave", authToken, async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.user_id;

  try {
    await pool.query(
      "DELETE FROM GroupMemberships WHERE group_id = $1 AND user_id = $2",
      [groupId, userId]
    );
    res.status(200).json({ message: "Successfully left the group." });
  } catch (error) {
    console.error("Error leaving the group:", error);
    res.status(500).json({ error: "Failed to leave the group." });
  }
});

groupRouter.get("/:groupId/membership", authToken, async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.user_id; // Extract user_id from the auth token

  try {
    const membership = await pool.query(
      "SELECT role FROM GroupMemberships WHERE group_id = $1 AND user_id = $2",
      [groupId, userId]
    );

    if (membership.rows.length === 0) {
      // User is not a member of the group
      return res.status(200).json({ isMember: false });
    }

    // User is a member, include their role
    const { role } = membership.rows[0];
    return res.status(200).json({ isMember: true, role });
  } catch (err) {
    console.error("Error checking membership status:", err);
    return res
      .status(500)
      .json({ error: "Failed to check membership status." });
  }
});

groupRouter.get("/:groupId/join-requests", async (req, res) => {
  const { groupId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT gm.user_id, gm.role, gm.status, u.email AS user_email
      FROM GroupMemberships gm
      JOIN Users u ON gm.user_id = u.user_id
      WHERE gm.group_id = $1 AND gm.status = 'pending'
      `,
      [groupId]
    );

    res.status(200).json(result.rows); // Include role and email in the response
  } catch (err) {
    console.error("Error fetching join requests:", err);
    res.status(500).json({ error: "Failed to fetch join requests." });
  }
});

groupRouter.get("/:groupId/details", async (req, res) => {
  const { groupId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT g.group_name, g.created_at, u.user_id AS admin_id, u.email AS admin_email
      FROM Groups g
      JOIN Users u ON g.owner_id = u.user_id
      WHERE g.group_id = $1
      `,
      [groupId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Group not found." });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching group details:", err);
    res.status(500).json({ error: "Failed to fetch group details." });
  }
});

//acctept from admin
groupRouter.post("/:groupId/accept", async (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body;

  try {
    await pool.query(
      "UPDATE GroupMemberships SET status = 'accepted' WHERE group_id = $1 AND user_id = $2",
      [groupId, userId]
    );
    res.status(200).json({ message: "Request accepted." });
  } catch (err) {
    console.error("Error accepting join request:", err);
    res.status(500).json({ error: "Failed to accept join request." });
  }
});

//reject from admin
groupRouter.post("/:groupId/reject", async (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body;

  try {
    await pool.query(
      "UPDATE GroupMemberships SET status = 'rejected' WHERE group_id = $1 AND user_id = $2",
      [groupId, userId]
    );
    res.status(200).json({ message: "Request rejected." });
  } catch (err) {
    console.error("Error rejecting join request:", err);
    res.status(500).json({ error: "Failed to reject join request." });
  }
});

//checking role
groupRouter.get("/:groupId/role", authToken, async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.user_id;

  try {
    const result = await pool.query(
      "SELECT role FROM GroupMemberships WHERE group_id = $1",
      [groupId, userId]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "User is not a member of this group." });
    }

    const role = result.rows[0].role;
    res.status(200).json({ role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error checking role" });
  }
});

groupRouter.get("/:groupId/members", async (req, res) => {
  const { groupId } = req.params;

  try {
    const members = await pool.query(
      `SELECT u.user_id, u.email AS user_email, gm.role
       FROM GroupMemberships gm
       JOIN Users u ON gm.user_id = u.user_id
       WHERE gm.group_id = $1 AND gm.status = 'accepted'`,
      [groupId]
    );

    res.status(200).json(members.rows);
  } catch (err) {
    console.error("Failed to fetch group members:", err);
    res.status(500).json({ error: "Failed to fetch group members." });
  }
});

//delete nember form admin
groupRouter.delete("/:groupId/members/:userId", authToken, async (req, res) => {
  const { groupId, userId } = req.params;

  try {
    // Check if the member exists in the group
    const memberCheckQuery = `
      SELECT * FROM GroupMemberships 
      WHERE group_id = $1 AND user_id = $2 AND status = 'accepted';
    `;
    const memberCheckResult = await pool.query(memberCheckQuery, [
      groupId,
      userId,
    ]);

    if (memberCheckResult.rowCount === 0) {
      return res.status(404).json({ error: "Member not found in the group." });
    }

    // Delete the member from the group
    const deleteQuery = `
      DELETE FROM GroupMemberships 
      WHERE group_id = $1 AND user_id = $2;
    `;
    await pool.query(deleteQuery, [groupId, userId]);

    res.status(200).json({ message: "Member successfully removed." });
  } catch (err) {
    console.error("Error removing member:", err);
    res.status(500).json({ error: "Failed to remove member." });
  }
});

groupRouter.get("/your-groups", authToken, async (req, res) => {
  const userId = req.user.user_id;

  try {
    const groups = await pool.query(
      `
      SELECT 
        g.group_id, 
        g.group_name, 
        g.created_at, 
        u.email AS owner_name, 
        gm.role 
      FROM Groups g
      INNER JOIN GroupMemberships gm ON g.group_id = gm.group_id 
      INNER JOIN Users u ON g.owner_id = u.user_id
      WHERE gm.user_id = $1
      ORDER BY g.created_at DESC
      `,
      [userId]
    );

    if (groups.rows.length === 0) {
      return res.status(200).json({ groups: [] });
    }
    return res.status(200).json({ groups: groups.rows });
  } catch (err) {
    console.error("Error fetching user's groups:", err);
    return res.status(500).json({ error: "Failed to fetch user's groups." });
  }
});

module.exports = { groupRouter };
