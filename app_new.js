const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const port = process.env.PORT || 3000;

const auth = require("./functionalities/firebase");
const requireAuth = require("./functionalities/authMiddleware");
const { Problem, User, Blog } = require("./functionalities/models");
const routes = require("./functionalities/routes");
const mongoose = require("./functionalities/database");

app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  [
    "/profile",
    "/dashboard",
    "/home",
    "/problems",
    "/problemDetail",
    "/blog",
    "/monthly-contest",
    "/leaderboard",
    "/contest",
    "/event",
    "/community",
  ],
  requireAuth
);

app.use("/", routes);

app.listen(port, function () {
  console.log(`Server is running on port ${port}`);
});
