const express = require("express");
const { authToken } = require("./config/auth.js"); // get the authentication working
const { userRouter } = require("./routes/userRoutes.js");
const { authRouter } = require("./routes/authRoute.js");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

//authentication should be working
app.get("/protected", authToken, (req, res) => {
  res.json({
    message: "You have access to this protected route!",
    user: req.user,
  });
});

app.use("/users", userRouter);
app.use("/auth", authRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
