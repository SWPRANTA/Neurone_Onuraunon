
const express = require("express");
const authMiddleware = require("./authMiddleware");
const auth = require("./firebase");
const { Problem, User, Blog } = require("./models");
const {getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, sendSignInLinkToEmail, signOut, signInWithPopup, GoogleAuthProvider } = require("firebase/auth");
const router = express.Router();

router.get("/landing", function (req, res) {
  res.render("user/landing");
});

router.get("/login", function (req, res) {
    res.render("login", { errorMessage: null });
});

router.post("/login", (req, res) => {
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

router.get("/logout", function (req, res) {
    signOut(auth)
        .then(() => {
            console.log("User logged out successfully.");
            res.redirect("/login");
        })
        .catch((error) => {
            console.error("Logout error:", error);
            res.redirect("/home");
        });
});

router.get("/signup", function (req, res) {
    res.render("user/signup", { errorMessage: "" });
});

router.post("/signup", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const name = req.body.name;
    if (password !== confirmPassword) {
        return res.render("user/signup", { errorMessage: "Passwords do not match." });
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
            res.render("user/signup", { errorMessage: "An error occurred during registration." });
        });
});


function sendVerificationEmail(email) {
    const actionCodeSettings = {
        url: `http://localhost:3000/verify?email=${email}`,
        handleCodeInrouter: true
    };

    sendSignInLinkToEmail(auth, email, actionCodeSettings)
        .then(() => {
            console.log("Verification email sent");
        })
        .catch((error) => {
            console.error("Error sending verification email:", error);
        });
}


router.get("/forgot-password", function (req, res) {
    res.render("user/forgot-password");
});


router.post("/forgot-password", (req, res) => {
    const email = req.body.email;

    sendPasswordResetEmail(auth, email)
        .then(() => {
            console.log("Password reset email sent successfully.");
            res.redirect("/login");
        })
        .catch((error) => {
            console.error("Error sending password reset email:", error);
            res.render("user/forgot-password", { errorMessage: "Failed to send password reset email." });
        });
});

router.get("/reset-password", (req, res) => {
    res.render("user/reset-password");
});

router.post("/reset-password", (req, res) => {
    const newPassword = req.body.newPassword;
    const confirmPassword = req.body.confirmPassword;

    if (newPassword !== confirmPassword) {
        return res.render("reset-password", { errorMessage: "Passwords do not match." });
    }

    const user = auth.currentUser;
    updatePassword(user, newPassword)
        .then(() => {
            console.log("Password updated successfully.");
            res.redirect("/login");
        })
        .catch((error) => {
            console.error("Error updating password:", error);
            res.render("user/reset-password", { errorMessage: "Failed to update password." });
        });
});

router.get("/home", function (req, res) {
    res.render("user/home");
});

router.get("/", function (req, res) {
    res.render('user/landing.ejs');
});

router.get("/blog", async (req, res) => {
    try {
        const blogs = await Blog.find();
        res.render("user/blog", { blogs });
    } catch (error) {
        console.error("Error fetching blogs:", error);
        res.render("user/blog", { blogs: [] });
    }
});
router.get("/blogContent", (req, res) => {
    res.render("blogContent");
});
router.get("/blog/:id", async (req, res) => {
    const blogId = req.params.id;
    try {
        const blog = await Blog.findById(blogId);
        if (blog) {
            res.render("user/blogContent", { blog });
        } else {
            res.status(404).send("Blog not found");
        }
    } catch (error) {
        console.error("Error fetching blog details:", error);
        res.status(500).send("An error occurred");
    }
});

router.get("/blog/prev/:id", async (req, res) => {
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

router.get("/blog/next/:id", async (req, res) => {
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
router.get("/problems", async (req, res) => {
    try {
        const page = req.query.page || 1; 
        const problemsPerPage = 15; 
        const skip = (page - 1) * problemsPerPage; 

        const keyword = req.query.keyword || ''; 

        let query = {};
        if (keyword) {

            query = { title: { $regex: keyword, $options: 'i' } };
        }

        const problems = await Problem.find(query).skip(skip).limit(problemsPerPage);

        const totalProblems = await Problem.countDocuments(query);

        const totalPages = Math.ceil(totalProblems / problemsPerPage);

        res.render("user/problems", { problems, page, totalPages, keyword });
    } catch (error) {
        console.error("Error fetching problems:", error);
        res.render("user/problems", { problems: [], page: 1, totalPages: 1, keyword: '' });
    }
});


router.get("/problems/:id", async (req, res) => {
    const problemId = req.params.id;
    try {
        const problem = await Problem.findById(problemId);
        if (problem) {
            res.render("user/problemDetail", { problem });
        } else {
            res.status(404).send("Problem not found");
        }
    } catch (error) {
        console.error("Error fetching problem details:", error);
        res.status(500).send("An error occurred");
    }
});

router.get("/problemDetail", (req, res) => {
    res.render("user/problemDetail");
});

router.post("/check-answer/:id", async (req, res) => {
    const problemId = req.params.id;
    const userAnswer = req.body.userAnswer;

    try {
        const problem = await Problem.findById(problemId);
        if (problem) {
            const correctAnswer = problem.solution;
            if (userAnswer === correctAnswer) {
                res.json({ result: "correct", message: "Correct answer! Well done!" });
            } else {
                res.json({ result: "incorrect", message: "Incorrect answer. Please try again." });
            }
        } else {
            res.status(404).send("Problem not found");
        }
    } catch (error) {
        console.error("Error checking answer:", error);
        res.status(500).send("An error occurred");
    }
});
  

router.get("/verify-email", (req, res) => {
    res.render("verify-email");
});

router.get("/verify", (req, res) => {
    const email = req.query.email;
    res.redirect("/home");
});

router.get("/admin", async (req, res) => {
    try {
        const problems = await Problem.find();
        res.render("admin/admin", { problems });
    } catch (error) {
        console.error("Error fetching problems:", error);
        res.render("admin/admin", { problems: [] });
    }
});
router.get("/modify-problem", async (req, res) => {
    try {
        const problems = await Problem.find();
        res.render("admin/modify-problem", { problems });
    } catch (error) {
        console.error("Error fetching problems:", error);
        res.render("admin/modify-problem", { problems: [] });
    }
});
router.get("/delete-problem/:id", async (req, res) => {
    const problemId = req.params.id;
    try {
        const problem = await Problem.findByIdAndRemove(problemId);
        if (problem) {
            console.log("Problem deleted:", problem.title);
        }
        res.redirect("/modify-problem");
    } catch (error) {
        console.error("Error deleting problem:", error);
        res.status(500).send("An error occurred");
    }
});


router.get("/update-problem/:id", async (req, res) => {
    const problemId = req.params.id;
    try {
        const problem = await Problem.findById(problemId);
        if (problem) {
            res.render("admin/update-problem", { problem });
        } else {
            res.status(404).send("Problem not found");
        }
    } catch (error) {
        console.error("Error fetching problem details:", error);
        res.status(500).send("An error occurred");
    }
});

router.post("/update-problem/:id", async (req, res) => {
    const problemId = req.params.id;
    const { title, statement, points, solution } = req.body;

    try {
        const problem = await Problem.findByIdAndUpdate(problemId, {
            title,
            statement,
            points,
            solution,
        });

        if (problem) {
            console.log("Problem updated:", problem.title);
            res.redirect("/modify-problem");
        } else {
            res.status(404).send("Problem not found");
        }
    } catch (error) {
        console.error("Error updating problem:", error);
        res.status(500).send("An error occurred");
    }
});



router.get("/add-problem", function (req, res) {
    res.render("admin/add-problem");
});

router.post("/create-problem", async (req, res) => {
    const { title, statement, points, solution } = req.body;

    try {
        const newProblem = new Problem({
            title,
            statement,
            points,
            solution,
        });

        await newProblem.save();
        console.log("New problem added:", newProblem.title);
        res.redirect("/modify-problem");
    } catch (error) {
        console.error("Error creating problem:", error);
        res.status(500).send("An error occurred");
    }
});


module.exports = router;
