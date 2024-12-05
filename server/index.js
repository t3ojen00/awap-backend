const express = require("express");
const cors = require("cors");
const { authToken } = require("./config/auth.js"); // get the authentication working
const { userRouter } = require("./routes/userRoutes.js");
const { moviesRouter } = require("./routes/moviesRoute"); // -sort by genre-
const { groupRouter } = require("./routes/groupRoutes.js"); //groupRoutes
const { reviewRouter } = require("./routes/reviewRoute.js");
const { ratingRouter } = require("./routes/ratingRoute.js");
const { messageRouter } = require("./routes/messageRoute.js");
const editPostRouter = require("./routes/editPostRoute.js");
const { favouriteRouter } = require("./routes/favouriteRoute.js");
// const createGroupRoutes = require("./routes/createGroupRoutes"); //Mowing to /groupRoutes H
const app = express();
const port = process.env.PORT || 3000;

console.log("movie router in index");

app.use(cors());
app.use(express.json());

app.use("/users", userRouter);
//authentication should be working
app.get("/protected", authToken, (req, res) => {
  res.json({
    message: "You have access to this protected route!",
    user: req.user,
  });
});

//app.use("/auth", authRouter);
app.use("/api", moviesRouter); // -sort by genre-
app.use("/favorites", favouriteRouter);

app.use("/groups", groupRouter); // route group

app.use("/reviews", reviewRouter);

app.use("/rating", ratingRouter);

// app.use("/createGroups",createGroupRoutes);// moving to groups H

app.use("/messages", messageRouter);

app.use("/forum", editPostRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
