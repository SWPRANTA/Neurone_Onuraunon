const express = require("express");
const mongoose = require("mongoose");
const app = express();
const port = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const { initializeApp } = require("firebase/app");
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendSignInLinkToEmail, signOut, signInWithPopup, GoogleAuthProvider } = require("firebase/auth");


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

const blogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    imageUrl: { type: String, required: true }
});

const Blog = mongoose.model("Blog", blogSchema);

function requireAuth(req, res, next) {
    const auth = getAuth();

    if (auth.currentUser) {
        next();
    } else {
        res.redirect("/login");
    }
}

app.use(["/profile", "/dashboard", "/home", "/problems", "/problemDetail", "/blog", "/monthly-contest", "/leaderboard", "/contest", "/event", "/community"], requireAuth);


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

app.get("/logout", function (req, res) {
    signOut(auth)
        .then(() => {
            console.log("User logged out successfully.");
            res.redirect("/login");
        })
        .catch((error) => {
            console.error("Logout error:", error);
            res.redirect("/home"); // Redirect to home page even on logout error
        });
});

app.get("/signup", function (req, res) {
    res.render("signup", { errorMessage: "" });
});

app.post("/signup", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const name = req.body.name;
    if (password !== confirmPassword) {
        return res.render("signup", { errorMessage: "Passwords do not match." });
    }

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;

            const newUser = new User({
                name: name,
                email: email,
                password: password,
                imageLink: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`
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

app.get("/auth/google", (req, res) => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user;
            console.log("Google login successful:", user.displayName);
            res.redirect("/home");
        })
        .catch((error) => {
            console.error("Google login error:", error);
            res.redirect("/login");
        });
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

app.get("/blog", async (req, res) => {
    try {
        const blogs = await Blog.find();
        res.render("blog", { blogs });
    } catch (error) {
        console.error("Error fetching blogs:", error);
        res.render("blogs", { blogs: [] });
    }
});
app.get("/blogContent", (req, res) => {
    res.render("blogContent");
});
app.get("/blog/:id", async (req, res) => {
    const blogId = req.params.id;
    try {
        const blog = await Blog.findById(blogId);
        if (blog) {
            res.render("blogContent", { blog });
        } else {
            res.status(404).send("Blog not found");
        }
    } catch (error) {
        console.error("Error fetching blog details:", error);
        res.status(500).send("An error occurred");
    }
});

app.get("/blog/prev/:id", async (req, res) => {
    const currentBlogId = req.params.id;
    try {
        const currentBlog = await Blog.findById(currentBlogId);
        if (currentBlog) {
            const prevBlog = await Blog.findOne({ _id: { $lt: currentBlogId } }).sort({ _id: -1 });
            if (prevBlog) {
                res.redirect(`/blog/${prevBlog._id}`);
            } else {
                res.redirect(`/blog/${currentBlog._id}`);
            }
        } else {
            res.status(404).send("Blog not found");
        }
    } catch (error) {
        console.error("Error fetching previous blog:", error);
        res.status(500).send("An error occurred");
    }
});

app.get("/blog/next/:id", async (req, res) => {
    const currentBlogId = req.params.id;
    try {
        const currentBlog = await Blog.findById(currentBlogId);
        if (currentBlog) {
            const nextBlog = await Blog.findOne({ _id: { $gt: currentBlogId } }).sort({ _id: 1 });
            if (nextBlog) {
                res.redirect(`/blog/${nextBlog._id}`);
            } else {
                res.redirect(`/blog/${currentBlog._id}`);
            }
        } else {
            res.status(404).send("Blog not found");
        }
    } catch (error) {
        console.error("Error fetching next blog:", error);
        res.status(500).send("An error occurred");
    }
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