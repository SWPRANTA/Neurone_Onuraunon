const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const { initializeApp } = require("firebase/app");
const { getAuth, createUserWithEmailAndPassword } = require("firebase/auth");


app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: true }));

const firebaseConfig = {
    apiKey: "AIzaSyBCyVtl534FJtcPz3eYKp1vKyBXkgj_6cg",
    authDomain: "neurone-onuraunon-f4d75.firebaseapp.com",
    projectId: "neurone-onuraunon-f4d75",
    storageBucket: "neurone-onuraunon-f4d75.appspot.com",
    messagingSenderId: "498240868731",
    appId: "1:498240868731:web:de455f8ade4e86e5af2dde",
    measurementId: "G-GC9VNB6B4C"
};
const appFirebase = initializeApp(firebaseConfig);
const auth = getAuth(appFirebase);

//Routes for different pages
app.get("/landing", function (req, res) {
    res.render("landing");
});

app.get("/login", function (req, res) {
    res.render("login", { errorMessage: null });
});


app.post("/login", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log("User registered:", user.email);
            res.redirect("/home"); // Redirect after successful registration
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error("Registration error:", errorCode, errorMessage);
            // Handle registration error
            res.redirect("/login"); // Redirect with error message, if needed
        });

    // try {
    //     // Create a new user with email and password
    //     const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    //     // User creation successful, redirect to home page
    //     res.redirect("/home");
    // } catch (error) {
    //     // Handle error and render the signup page with an error message
    //     res.render("login", { errorMessage: error.message });
    // }
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
    res.render('landing.ejs');
});

app.get("/problems", function (req, res) {
    res.render("problems");
});
app.get("/math", function (req, res) {
    res.render("math");
});

app.listen(port, function () {
    console.log(`Server is running on port ${port}`);
});