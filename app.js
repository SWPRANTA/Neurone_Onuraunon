const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const { initializeApp } = require("firebase/app");
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendSignInLinkToEmail  } = require("firebase/auth");


app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: true }));

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
            res.redirect("/home");
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

// app.post("/signup", (req, res) => {
//     const email = req.body.email;
//     const password = req.body.password;
//     const confirmPassword = req.body.confirmPassword;

//     if (password !== confirmPassword) {
//         return res.render("signup", { errorMessage: "Passwords do not match." });
//     }

//     createUserWithEmailAndPassword(auth, email, password)
//         .then((userCredential) => {
//             const user = userCredential.user;
//             console.log("User registered:", user.email);
//             res.redirect("/home");
//         })
//         .catch((error) => {
//             const errorCode = error.code;
//             const errorMessage = error.message;
//             console.error("Registration error:", errorCode, errorMessage);
//             res.render("signup", { errorMessage: "An error occurred during registration." });
//         });
// });

// Function to send a verification email
app.post("/signup", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    if (password !== confirmPassword) {
        return res.render("signup", { errorMessage: "Passwords do not match." });
    }

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log("User registered:", user.email);

            // Send verification email
            sendVerificationEmail(user.email);

            res.redirect("/verify-email"); // Redirect to the verification page
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.error("Registration error:", errorCode, errorMessage);
            res.render("signup", { errorMessage: "An error occurred during registration." });
        });
});

// Function to send a verification email
function sendVerificationEmail(email) {
    const actionCodeSettings = {
        url: `http://localhost:3000/verify?email=${email}`, // Replace with your actual verification URL
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

app.get("/problems", function (req, res) {
    res.render("problems");
});
app.get("/math", function (req, res) {
    res.render("math");
});

app.get("/verify-email", (req, res) => {
    res.render("verify-email");
});

app.get("/verify", (req, res) => {
    // Extract the email from the query parameter
    const email = req.query.email;

    // Redirect the user to the home page after verification
    res.redirect("/home");
});




app.listen(port, function () {
    console.log(`Server is running on port ${port}`);
});
