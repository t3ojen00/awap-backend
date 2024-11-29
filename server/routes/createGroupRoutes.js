const express = require("express");
const router = express.Router();
const pool = require("../config/dbnew"); // Database connection pool

// POST: Create a new group
router.post("/", async (req, res) => {
  const { group_name, owner_id } = req.body;

  if (!group_name || !owner_id) {
    return res.status(400).json({ error: "group_name and owner_id are required." });
  }

  const normalizedGroupName = group_name.trim().toLowerCase();

  try {
    const existingGroup = await pool.query(
      "SELECT * FROM groups WHERE LOWER(TRIM(group_name)) = $1",
      [normalizedGroupName]
    );

    if (existingGroup.rows.length > 0) {
      return res.status(400).json({ error: "Group with this name already exists." });
    }

    // Create the new group
    const newGroup = await pool.query(
      "INSERT INTO groups (group_name, owner_id) VALUES ($1, $2) RETURNING *",
      [normalizedGroupName, owner_id]
    );

    // Fetch the owner_name from the users table
    const createdGroup = await pool.query(
      `SELECT 
         g.group_id, 
         g.group_name, 
         g.owner_id, 
         u.name AS owner_name
       FROM groups g
       JOIN users u ON g.owner_id = u.user_id
       WHERE g.group_id = $1`,
      [newGroup.rows[0].group_id]
    );

    res.status(201).json(createdGroup.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// GET: List all groups (include owner_name)
router.get("/", async (req, res) => {
  try {
    // Fetch groups with owner_name by joining groups and users
    const result = await pool.query(`
      SELECT 
        g.group_id, 
        g.group_name, 
        g.owner_id, 
        u.name AS owner_name, 
        g.created_at
      FROM groups g
      JOIN users u ON g.owner_id = u.user_id
    `);

    res.status(200).json(result.rows); // Return the groups with owner_name included
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET: View a specific group by ID (include owner_name)
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch the group by ID and include owner_name
    const result = await pool.query(`
      SELECT 
        g.group_id, 
        g.group_name, 
        g.owner_id, 
        u.name AS owner_name, 
        g.created_at
      FROM groups g
      JOIN users u ON g.owner_id = u.user_id
      WHERE g.group_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Group not found." });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE: Delete a group by ID (only for the owner)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const { owner_id } = req.body;

  try {
    // Check if the group exists and if the requester is the owner
    const result = await pool.query(
      "SELECT * FROM groups WHERE group_id = $1 AND owner_id = $2",
      [id, owner_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Group not found or you're not the owner." });
    }

    // Delete the group
    await pool.query("DELETE FROM groups WHERE group_id = $1", [id]);

    res.status(200).json({ message: "Group deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
