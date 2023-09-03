const express = require("express");
const mongoose = require("mongoose");
const app = express();
const port = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const { initializeApp } = require("firebase/app");
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendSignInLinkToEmail } = require("firebase/auth");


app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: true }));

mongoose
    .connect("mongodb://127.0.0.1:27017/neurone_onuraunon", { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("mongoose started");
    })
    .catch((err) => {
        console.log("Error: ", err);
    });

const firebaseConfig = {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    measurementId: ""
};
const appFirebase = initializeApp(firebaseConfig);
const auth = getAuth(appFirebase);

const problemSchema = new mongoose.Schema({
    title: { type: String, required: true },
    statement: { type: String, required: true },
    solution: { type: String, required: true },
    points: { type: Number, required: true }
});
const Problem = mongoose.model("Problem", problemSchema);

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    problemsSolved: { type: Number, default: 0 },
    contestsJoined: { type: Number, default: 0 },
    imageLink: { type: String, default: '' }
});

const User = mongoose.model("User", userSchema);



app.get("/landing", function (req, res) {
    res.render("landing");
});

app.get("/login", function (req, res) {
    res.render("login", { errorMessage: null });
});

app.post("/login", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log("User logged in:", user.email);
            link = `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`;
            res.redirect("/home", {imageLink: link});
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error("Login error:", errorCode, errorMessage);
            res.render("login", { errorMessage: "Invalid email or password." });
        });
});


app.get("/signup", function (req, res) {
    res.render("signup", { errorMessage: "" });
});

app.post("/signup", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const name = req.body.name; // Add this line to get the user's name

    if (password !== confirmPassword) {
        return res.render("signup", { errorMessage: "Passwords do not match." });
    }

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;

            // Save user information to MongoDB
            const newUser = new User({
                name: name,
                email: email,
                password: password,
                imageLink:`https://api.dicebear.com/7.x/bottts/svg?seed=${email}`
            });

            newUser.save()
                .then(savedUser => {
                    console.log("User registered:", savedUser.email);
                    sendVerificationEmail(savedUser.email);
                    res.redirect("/verify-email");
                })
                .catch(error => {
                    console.error("Error saving user:", error);
                    res.render("signup", { errorMessage: "An error occurred during registration." });
                });
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error("Registration error:", errorCode, errorMessage);
            res.render("signup", { errorMessage: "An error occurred during registration." });
        });
});


function sendVerificationEmail(email) {
    const actionCodeSettings = {
        url: `http://localhost:3000/verify?email=${email}`,
        handleCodeInApp: true
    };

    sendSignInLinkToEmail(auth, email, actionCodeSettings)
        .then(() => {
            console.log("Verification email sent");
        })
        .catch((error) => {
            console.error("Error sending verification email:", error);
        });
}


app.get("/forgot-password", function (req, res) {
    res.render("forgot-password");
});


app.get("/home", function (req, res) {
    res.render("home");
});

app.get("/", function (req, res) {
    res.render('landing.ejs');
});


app.get("/problems", async (req, res) => {
    try {
        const problems = await Problem.find();
        res.render("problems", { problems });
    } catch (error) {
        console.error("Error fetching problems:", error);
        res.render("problems", { problems: [] });
    }
});

app.get("/problems/:id", async (req, res) => {
    const problemId = req.params.id;
    try {
        const problem = await Problem.findById(problemId);
        if (problem) {
            res.render("problemDetail", { problem });
        } else {
            res.status(404).send("Problem not found");
        }
    } catch (error) {
        console.error("Error fetching problem details:", error);
        res.status(500).send("An error occurred");
    }
});

app.get("/problemDetail", (req, res) => {
    res.render("problemDetail");
});

app.get("/verify-email", (req, res) => {
    res.render("verify-email");
});

app.get("/verify", (req, res) => {
    const email = req.query.email;
    res.redirect("/home");
});

app.listen(port, function () {
    console.log(`Server is running on port ${port}`);
});