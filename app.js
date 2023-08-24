const express = require("express");

const app = express();

app.set("view engine", "ejs");
// app.use(express.static("public"));
app.use(express.static(__dirname + "/public"));

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/landing.html");
});
app.get("/landing", function (req, res) {
    res.render("landing");
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