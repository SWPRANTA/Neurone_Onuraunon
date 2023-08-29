const express = require("express");
const passport = require('passport');

const GoogleStrategy = require('passport-google-oauth2').Strategy;
const path = require('path');

const app = express();

const GOOGLE_CLIENT_ID = '';
const GOOGLE_CLIENT_SECRET = '';

app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));
app.use(express.urlencoded({ extended: true }));
// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Configure Google OAuth
passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/home",
}, function (accessToken, refreshToken, profile, done) {
    // Perform user registration or other actions here
    // For now, returning the profile as the user
    console.log("Authenticated user data:", profile);
    return done(null, profile);
}));

// Serialize and deserialize user
passport.serializeUser(function (user, done) {
    done(null, user);
});
passport.deserializeUser(function (user, done) {
    done(null, user);
});

// Google authentication route
app.get('/auth/google', passport.authenticate('google', {
    scope: ['email', 'profile']
}));

// Google callback route
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        req.session.userProfilePicture = req.user.photos[0].value;
        // Successful authentication, redirect to home page or user dashboard
        res.redirect('/home');
    }
);



app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

//Routes for different pages
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
    res.render("home", { userProfilePicture: req.session.userProfilePicture });
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
