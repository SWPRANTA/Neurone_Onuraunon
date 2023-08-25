const express = require("express");

const app = express();

app.set("view engine", "ejs");
// app.use(express.static("public"));
app.use(express.static(__dirname + "/public"));

app.get("/landing", function (req, res) {
    res.render("landing");
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/signup", function (req, res) {
    res.render("signup");
});

app.get("/forgot-password", function (req, res) {
    res.render("forgot-password");
});

app.get("/home", function (req, res) {
    res.render("home");
});

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/landing.html");
});

app.get("/problems", function (req, res) {
    res.render("problems");
});
app.get("/math", function (req, res) {
    res.render("math");
});

app.listen(3000, function () {
    console.log("Server is running on port 3000!");
});