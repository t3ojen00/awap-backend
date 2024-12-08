const express = require("express");
const pool = require("../config/db");
const groupRouter = express.Router();
const { authToken } = require("../config/auth"); // Middleware for authentication

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
        u.user_name AS owner_name, 
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
      SELECT g.group_name, g.created_at, u.user_id AS admin_id, u.user_name AS admin_name
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
      [groupId, userId, "pending", "pending"]
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

groupRouter.get("/:groupId/member-requests", authToken, async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.user_id;

  try {
    const result = await pool.query(
      `
      SELECT gm.user_id, u.user_name
      FROM GroupMemberships gm
      JOIN Users u ON gm.user_id = u.user_id
      WHERE gm.group_id = $1 AND gm.status = 'pending'
      `,
      [groupId]
    );

    return res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching join requests:", err);
    res.status(500).json({ error: "Failed to fetch join requests." });
  }
});

groupRouter.get("/:groupId/member-invitated", authToken, async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.user_id; // Get the user ID from the authenticated user token

  try {
    // Query to check if the user has an invitation for the specified group
    const result = await pool.query(
      `
      SELECT gm.user_id, u.user_name, g.group_name
      FROM GroupMemberships gm
      JOIN Users u ON gm.user_id = u.user_id
      JOIN Groups g ON gm.group_id = g.group_id
      WHERE gm.user_id = $1 AND gm.group_id = $2 AND gm.status = 'invited'
      `,
      [userId, groupId]
    );

    // If no invitation is found, return a 404 error
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No invitation found." });
    }

    // Return the first (and only) invitation found for this user
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    // Log the error and return a 500 error response
    console.error("Error fetching invitations:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch invitations. Please try again later." });
  }
});

groupRouter.post("/:groupId/accept", authToken, async (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body;

  try {
    // Update the role and status to 'member' and 'accepted'
    const updateResult = await pool.query(
      "UPDATE GroupMemberships SET role = $1, status = $2 WHERE group_id = $3 AND user_id = $4",
      ["member", "accepted", groupId, userId]
    );

    if (updateResult.rowCount === 0) {
      return res
        .status(404)
        .json({ error: "Membership not found or already processed." });
    }

    res
      .status(200)
      .json({ message: "Request accepted and role updated to member." });
  } catch (err) {
    console.error("Error updating role:", err);
    res
      .status(500)
      .json({ error: "Failed to accept request. Please try again later." });
  }
});
//reject from admin
// Reject join request
groupRouter.post("/:groupId/reject", authToken, async (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body;

  try {
    const pendingRequest = await pool.query(
      "SELECT * FROM GroupMemberships WHERE group_id = $1 AND user_id = $2 AND role = $3 AND status = $4",
      [groupId, userId, "pending", "pending"]
    );

    if (pendingRequest.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "No pending request found for this user." });
    }

    await pool.query(
      "DELETE FROM GroupMemberships WHERE group_id = $1 AND user_id = $2",
      [groupId, userId]
    );

    res
      .status(200)
      .json({ message: "Request rejected. User is not a member." });
  } catch (err) {
    console.error("Error rejecting join request:", err);
    res.status(500).json({ error: "Failed to reject join request." });
  }
});

groupRouter.get("/:groupId/role", authToken, async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user.user_id;

  try {
    const result = await pool.query(
      "SELECT role, status FROM GroupMemberships WHERE group_id = $1 AND user_id = $2",
      [groupId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(200).json({ isMember: false, isInvited: false });
    }

    const { role, status } = result.rows[0];
    res.status(200).json({
      isMember: status === "accepted",
      isInvited: status === "invited",
      role,
    });
  } catch (err) {
    console.error("Error fetching membership status:", err);
    res.status(500).json({ error: "Failed to fetch membership status." });
  }
});

groupRouter.get("/:groupId/members", async (req, res) => {
  const { groupId } = req.params;

  try {
    const members = await pool.query(
      `SELECT u.user_id, u.user_name AS user_name, gm.role
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
        u.user_name AS owner_name, 
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

// Invite a member to a group
groupRouter.post("/:groupId/invite", authToken, async (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body;
  const inviterId = req.user.user_id;

  try {
    const inviterRoleCheck = await pool.query(
      "SELECT role FROM GroupMemberships WHERE group_id = $1 AND user_id = $2 AND role = 'admin'",
      [groupId, inviterId]
    );

    if (inviterRoleCheck.rowCount === 0) {
      return res
        .status(403)
        .json({ error: "You must be an admin to invite members." });
    }

    const membershipCheck = await pool.query(
      "SELECT * FROM GroupMemberships WHERE group_id = $1 AND user_id = $2",
      [groupId, userId]
    );

    if (membershipCheck.rowCount > 0) {
      return res.status(400).json({
        error: "User is already a member or has a pending invitation.",
      });
    }

    await pool.query(
      "INSERT INTO GroupMemberships (group_id, user_id, role, status) VALUES ($1, $2, $3, $4)",
      [groupId, userId, "pending", "invited"]
    );

    res.status(200).json({ message: "Invitation sent successfully." });
  } catch (err) {
    console.error("Error inviting member:", err);
    res.status(500).json({ error: "Failed to send invitation." });
  }
});

// Respond to an invitation (accept or reject)
groupRouter.post("/:groupId/respond", authToken, async (req, res) => {
  const { groupId } = req.params;
  const { response } = req.body;
  const userId = req.user.user_id;

  try {
    const checkInvite = await pool.query(
      "SELECT * FROM GroupMemberships WHERE group_id = $1 AND user_id = $2 AND status = 'invited'",
      [groupId, userId]
    );

    if (checkInvite.rowCount === 0) {
      return res.status(400).json({ error: "No pending invitation found." });
    }

    if (response === "accept") {
      await pool.query(
        "UPDATE GroupMemberships SET role = 'member', status = 'accepted' WHERE group_id = $1 AND user_id = $2",
        [groupId, userId]
      );
      res.status(200).json({
        message: "You have successfully joined the group as a member.",
      });
    } else if (response === "reject") {
      await pool.query(
        "DELETE FROM GroupMemberships WHERE group_id = $1 AND user_id = $2",
        [groupId, userId]
      );
      res.status(200).json({ message: "You have rejected the invitation." });
    } else {
      res
        .status(400)
        .json({ error: "Invalid response. Use 'accept' or 'reject'." });
    }
  } catch (err) {
    console.error("Error responding to invitation:", err);
    res.status(500).json({ error: "Failed to respond to the invitation." });
  }
});

groupRouter.get("/:groupId/non-members", authToken, async (req, res) => {
  const { groupId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT u.user_id, u.user_name
      FROM Users u
      WHERE u.user_id NOT IN (
        SELECT gm.user_id FROM GroupMemberships gm WHERE gm.group_id = $1
      )
      AND u.user_id != $2
      `,
      [groupId, req.user.user_id] // Exclude the current admin
    );

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching non-members:", err);
    res.status(500).json({ error: "Failed to fetch non-member users." });
  }
});

module.exports = { groupRouter };
