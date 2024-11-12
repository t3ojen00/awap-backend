const express = require('express');
const { authToken } = require('../config/auth');
//const db = require('../config/db');


console.log('user router executed')
const userRouter = express.Router();

// get the user id to the db and use the auth.js to keep the same user logged in
userRouter.get('/:user_id', authToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.id, 10);
      if (isNaN(userId)) {
        return res.status(400).send({ error: 'User ID must be a number' });
      }
  
      const userInfo = await getUserInformation(userId);
  
      if (userInfo.length === 0) {
        return res.status(404).send({ error: 'User not found' });
      }
  
      res.json(userInfo[0]);
    } catch (error) {
      console.error('Failed to get user information:', error);
      res.status(500).send({ error: 'Internal Server Error' });
    }
  });


//registeration to the site
  userRouter.post("/registeration", async (req, res) => {
    bcrypt.hash(req.body.password, 10, async (err, hash) => {
      if (!err) {
        try {
          const sql = "INSERT INTO Users (email, password_hash) VALUES ($1,$2) RETURNING user_id"
          const result = await db.query(sql, [req.body.email, hash])
          res.status(200).json({ id: result.rows[0].id })
        } catch (error) {
          res.statusMessage = error
          res.status(500).json({ error: error })
        }
      } else {
        res.statusMessage = err
        res.status(500).json({ error: err })
      }
    })
  })

  module.exports = {
    userRouter,
  }