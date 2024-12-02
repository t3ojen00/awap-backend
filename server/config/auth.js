require("dotenv").config();
const jwt = require("jsonwebtoken");

function authToken(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token)
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token." });
    // req.user = user;

    // Map `userId` to `user_id` for consistency// Add for groupRoute
    req.user = { ...user, user_id: user.userId };
    // console.log("Decoded JWT:", req.user); // Log for debugging

    next();
  }); //change JWT_SECRET -> JWT_SECRET_KEY
}

module.exports = { authToken };
