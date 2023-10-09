const express = require("express");
const session = require("express-session");
const authMiddleware = require("./authMiddleware");
const auth = require("./firebase");
require('dotenv').config();
const crypto = require("crypto");
const { Problem, User, Blog, Notification, Contest, Event, Fest } = require("./models");
const { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, sendSignInLinkToEmail, signOut, signInWithPopup, GoogleAuthProvider } = require("firebase/auth");
const router = express.Router();
const mongoose = require("mongoose");
const { log } = require("console");
const https = require("https");


const generateSecretKey = () => {
    const secretLength = 64; // You can adjust the length as needed
    return crypto.randomBytes(secretLength).toString("hex");
};
const secretKey = generateSecretKey();

router.use(
    session({
        secret: secretKey,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false, },
    })
);

function isAuthenticated(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect("/login");
    }
}
router.get("/", function (req, res) {
    res.render('user/landing.ejs');
});

router.get("/landing", function (req, res) {
    res.render("user/landing");
});

router.get("/login", function (req, res) {
    res.render("login", { errorMessage: null });
});


router.post("/login", async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.render("login", { errorMessage: "Invalid email or password." });
        }

        if (user.role === "admin") {

            if (password === user.password) {

                req.session.user = user;
                console.log("Admin user logged in:", user.email);
                res.redirect("/home");
            } else {
                console.error("Login error: Invalid email or password.");
                res.render("login", { errorMessage: "Invalid email or password." });
            }
        } else if (user.role === "user") {
            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    req.session.user = user; // Store the user object in the session
                    console.log("User logged in:", user.email);
                    res.redirect("/home");
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    console.error("Login error:", errorCode, errorMessage);
                    res.render("login", { errorMessage: "Invalid email or password." });
                });
        } else {
            console.error("Login error: Invalid role.");
            res.render("login", { errorMessage: "Invalid email or password." });
        }
    } catch (error) {
        console.error("Login error:", error);
        res.render("login", { errorMessage: "An error occurred during login." });
    }
});


router.get("/logout", function (req, res) {
    req.session.destroy((err) => {
        if (err) {
            console.error("Session destruction error:", err);
        } else {
            console.log("User logged out successfully.");
            res.redirect("/login");
        }
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
                role: "user",
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

router.get("/home", isAuthenticated, function (req, res) {
    const isAdmin = req.session.user && req.session.user.role === "admin";
    res.render("user/home", { isAdmin });
});

//Blog section
router.get("/blog", isAuthenticated, async (req, res) => {
    const isAdmin = req.session.user && req.session.user.role === "admin";
    try {
        const blogs = await Blog.find();
        res.render("user/blog", { blogs, isAdmin });
    } catch (error) {
        console.error("Error fetching blogs:", error);
        res.render("user/blog", { blogs: [], isAdmin });
    }
});


router.get("/blogContent", isAuthenticated, (req, res) => {
    const isAdmin = req.session.user && req.session.user.role === "admin";
    res.render("blogContent", { isAdmin });
});


router.get("/blog/:id", isAuthenticated, async (req, res) => {
    const blogId = req.params.id;
    const isAdmin = req.session.user && req.session.user.role === "admin";
    try {
        const blog = await Blog.findById(blogId);
        if (blog) {
            res.render("user/blogContent", { blog, isAdmin });
        } else {
            res.status(404).send("Blog not found");
        }
    } catch (error) {
        console.error("Error fetching blog details:", error);
        res.status(500).send("An error occurred");
    }
});


router.get("/blog/prev/:id", isAuthenticated, async (req, res) => {
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

router.get("/blog/next/:id", isAuthenticated, async (req, res) => {
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

router.get("/request-blog", isAuthenticated, (req, res) => {
    res.render("user/request-blog");
});
// function isAuthenticated(req, res, next) {
//     const user = auth.currentUser;
//     if (user) {
//         req.user = user;
//         next();
//     } else {
//         console.log("In here");
//         res.redirect("/login");
//     }
// }
router.post("/request-blog", isAuthenticated, async (req, res) => {
    const { title, image, description } = req.body;
    const requesterUserId = req.session.user._id;
    console.log(requesterUserId);

    try {
        const notification = new Notification({
            requesterUserId: requesterUserId,
            blogTitle: title,
            description,
            imageUrl: image,
            status: 'pending',
            createdAt: Date.now()
        });
        await notification.save();
        console.log("Blog request notification created.");
        res.redirect("/blog");
    } catch (error) {
        console.error("Error creating blog request notification:", error);
        res.status(500).send("An error occurred");
    }
});


router.get("/admin-notification", isAuthenticated, async (req, res) => {
    const isAdmin = req.session.user && req.session.user.role === "admin";
    if (!isAdmin) {
        return res.status(403).send("Access denied");
    }

    try {
        const pendingNotifications = await Notification.find({ status: 'pending' });

        res.render("admin/admin-notification", { notifications: pendingNotifications });
    } catch (error) {
        console.error("Error fetching pending notifications:", error);
        res.status(500).send("An error occurred");
    }
});

router.post("/admin-notification/:id", isAuthenticated, async (req, res) => {
    const isAdmin = req.session.user && req.session.user.role === "admin";
    if (!isAdmin) {
        return res.status(403).send("Access denied");
    }

    const notificationId = req.params.id;
    const action = req.body.action;

    try {
        const notification = await Notification.findById(notificationId);

        if (!notification) {
            return res.status(404).send("Notification not found");
        }

        if (action === 'accept') {
            const newBlog = new Blog({
                title: notification.blogTitle,
                description: notification.description,
                date: notification.createdAt,
                imageUrl: notification.imageUrl
            });
            await newBlog.save();

            notification.status = 'accepted';
        } else if (action === 'reject') {
            notification.status = 'rejected';
        }
        await notification.save();
        res.redirect("/admin-notification");
    } catch (error) {
        console.error("Error handling notification action:", error);
        res.status(500).send("An error occurred");
    }
});

//Problem section
router.get("/problems", isAuthenticated, async (req, res) => {
    const isAdmin = req.session.user && req.session.user.role === "admin";

    try {
        const users = await User.find().sort({ totalPoints: -1 });
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

        res.render("user/problems", { problems, page, totalPages, keyword, isAdmin, users });
    } catch (error) {
        console.error("Error fetching problems:", error);
        res.render("user/problems", { problems: [], page: 1, totalPages: 1, keyword: '', isAdmin, users });
    }
});

router.get("/problems/:id", isAuthenticated, async (req, res) => {
    const problemId = req.params.id;
    const isAdmin = req.session.user && req.session.user.role === "admin";
    try {
        const problem = await Problem.findById(problemId);
        if (problem) {
            res.render("user/problemDetail", { problem, isAdmin });
        } else {
            res.status(404).send("Problem not found");
        }
    } catch (error) {
        console.error("Error fetching problem details:", error);
        res.status(500).send("An error occurred");
    }
});

router.post("/check-answer/:id", isAuthenticated, async (req, res) => {
    const problemId = req.params.id;
    const userAnswer = req.body.userAnswer;
    const isAdmin = req.session.user && req.session.user.role === "admin";
    const sessionuser = req.session.user;

    try {
        const problem = await Problem.findById(problemId);
        const user = await User.findOne({ email: sessionuser.email });
        if (problem) {
            const correctAnswer = problem.solution;
            if (userAnswer === correctAnswer) {
                user.problemsSolved = user.problemsSolved + 1;
                user.totalPoints = user.totalPoints + problem.points;

                res.json({ result: "correct", message: "Correct answer! Well done!" });
            } else {

                res.json({ result: "incorrect", message: "Incorrect answer. Please try again." });
            }
            user.problemAttempted = user.problemAttempted + 1;
            await user.save();
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

router.get("/admin", isAuthenticated, async (req, res) => {
    const isAdmin = req.session.user && req.session.user.role === "admin";
    try {
        const problems = await Problem.find();
        res.render("admin/admin", { problems, isAdmin });
    } catch (error) {
        console.error("Error fetching problems:", error);
        res.render("admin/admin", { problems: [], isAdmin });
    }
});

//Problem section for Admin
router.get("/modify-problem", isAuthenticated, async (req, res) => {
    try {
        const problems = await Problem.find();
        res.render("admin/modify-problem", { problems });
    } catch (error) {
        console.error("Error fetching problems:", error);
        res.render("admin/modify-problem", { problems: [] });
    }
});

router.get("/delete-problem/:id", isAuthenticated, async (req, res) => {
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


router.get("/update-problem/:id", isAuthenticated, async (req, res) => {
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

router.post("/update-problem/:id", isAuthenticated, async (req, res) => {
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

router.get("/add-problem", isAuthenticated, function (req, res) {
    res.render("admin/add-problem");
});

router.post("/create-problem", isAuthenticated, async (req, res) => {
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

//Blog section for Admin
router.get("/modify-blog", isAuthenticated, async (req, res) => {
    try {
        const blogs = await Blog.find();
        res.render("admin/modify-blog", { blogs });
    } catch (error) {
        console.error("Error fetching blogs:", error);
        res.render("admin/modify-blog", { blogs: [] });
    }
});


router.get("/delete-blog/:id", isAuthenticated, async (req, res) => {
    const blogID = req.params.id;
    console.log("Am I here?");
    try {
        const blog = await Blog.findByIdAndRemove(blogID);
        if (blog) {
            console.log("Blog deleted:", blog.title);
        }
        res.redirect("/modify-blog");
    } catch (error) {
        console.error("Error deleting blog:", error);
        res.status(500).send("An error occurred");
    }
});


router.get("/update-blog/:id", isAuthenticated, async (req, res) => {
    const blogID = req.params.id;
    try {
        const blog = await Blog.findById(blogID);
        if (blog) {
            res.render("admin/update-blog", { blog });
        } else {
            res.status(404).send("Blog not found");
        }
    } catch (error) {
        console.error("Error fetching blog details:", error);
        res.status(500).send("An error occurred");
    }
});

router.post("/update-blog/:id", isAuthenticated, async (req, res) => {
    const blogID = req.params.id;
    const { title, imageUrl, description } = req.body;

    try {
        const blog = await Blog.findByIdAndUpdate(blogID, {
            title,
            description,
            date: Date.now(),
            imageUrl,
        });

        if (blog) {
            console.log("Blog updated:", blog.title);
            res.redirect("/modify-blog");
        } else {
            res.status(404).send("Blog not found");
        }
    } catch (error) {
        console.error("Error updating blog:", error);
        res.status(500).send("An error occurred");
    }
});



router.get("/add-blog", isAuthenticated, function (req, res) {
    res.render("admin/add-blog");
});

router.post("/create-blog", isAuthenticated, async (req, res) => {
    const { title, image, description } = req.body;

    try {
        const newBlog = new Blog({
            title,
            description,
            date: Date.now(),
            imageUrl: image
        });

        await newBlog.save();
        console.log("New BLog added:", newBlog.title);
        res.redirect("/modify-blog");
    } catch (error) {
        console.error("Error creating blog:", error);
        res.status(500).send("An error occurred");
    }
});


// Contest Section for Admin
router.get("/modify-contest", isAuthenticated, async (req, res) => {
    try {
        const contests = await Contest.find();
        res.render("admin/modify-contest", { contests });
    } catch (error) {
        console.error("Error fetching Contests:", error);
        res.render("admin/modify-contest", { contests: [] });
    }
});
router.get("/modify-contest/add-contest", isAuthenticated, function (req, res) {
    res.render("admin/add-contest");
});

router.post("/modify-contest/add-contest", isAuthenticated, async (req, res) => {
    const { title, 'sub-title': subTitle, 'start-time': startTime, 'end-time': endTime, 'questionNumber': questionNumber, publish } = req.body;
    const booleanValue = (publish === "true");

    const questionIDs = [];
    for (let i = 1; i < questionNumber; i++) {
        const questionTitle = req.body[`detailed-question-title-${i}`];
        const problemStatement = req.body[`detailed-question-statement-${i}`];
        const solution = req.body[`detailed-question-solution-${i}`];
        const points = req.body[`detailed-question-points-${i}`];
        const problemID = req.body[`simple-question-${i}`];
        if (problemID) {
            try {
                const problembyID = await Problem.findById(problemID);
                if (problembyID) {
                    console.log('problem found for id: ', problemID);
                    questionIDs.push(problemID);
                }
                else {
                    console.log("Problem not found for id: ", problemID);
                    res.status(404).send("Problem not found");
                }
            } catch (error) {
                console.error("Error getting problem:", error);
                res.status(500).send("An error occurred");
            }
        }
        else {
            try {
                const newProblem = new Problem({
                    title: questionTitle,
                    statement: problemStatement,
                    solution: solution,
                    points: points,
                    solved_count: 0,
                    attempt: 0
                });

                await newProblem.save();
                questionIDs.push(newProblem._id);

            } catch (error) {
                console.error("Error creating new problem:", error);
                res.status(500).send("An error occurred");
            }
        }
    }

    try {
        const questionObjectIDs = questionIDs.map((str) => new mongoose.Types.ObjectId(str));
        const newContest = new Contest({
            title: title,
            subtitle: subTitle,
            startTime: startTime,
            endTime: endTime,
            questions: questionObjectIDs,
            createdAt: Date.now(),
            publish: booleanValue,
        });

        await newContest.save();
        console.log("New contest created:", newContest.title);

        res.redirect("/modify-contest");
    } catch (error) {
        console.error("Error creating contest:", error);
        res.status(500).send("An error occurred. Creating contest");
    }
});

router.get("/modify-contest/contests/delete-contest/:id", isAuthenticated, async (req, res) => {
    const contestID = req.params.id;
    try {
        const contest = await Contest.findByIdAndRemove(contestID);
        if (contest) {
            console.log("Contest deleted:", contest.title);
        }
        res.redirect("/modify-contest");
    } catch (error) {
        console.error("Error deleting Contest:", error);
        res.status(500).send("An error occurred");
    }
});

router.get("/modify-contest/contests/preview-contest/:id", isAuthenticated, async (req, res) => {
    const contestID = req.params.id;
    try {
        const contest = await Contest.findById(contestID).lean();
        if (contest) {

            const problems = await Problem.find({ _id: { $in: contest.questions } }).lean();
            res.render("admin/contest-details", { contest, problems });
        }
    } catch (error) {
        console.error("Error Finding Contest and rendering contest-details:", error);
        res.status(500).send("An error occurred");
    }
});

//Contest Section for user
router.get("/contests", isAuthenticated, async (req, res) => {
    const isAdmin = req.session.user && req.session.user.role === "admin";
    try {
        // Fetch contests where publish is true
        const contests = await Contest.find({ publish: true }).exec();
        res.render("user/contest.ejs", { isAdmin, contests });
    } catch (error) {
        console.error("Error fetching contests:", error);
        res.status(500).send("An error occurred");
    }
});
router.get("/contests/contest-details/:contestId", async (req, res) => {
    const contestId = req.params.contestId;
    const isAdmin = req.session.user && req.session.user.role === "admin";
    const user = req.session.user;
    try {
        const contest = await Contest.findById(contestId);
        let userIsRegistered = false;
        if (!contest) {
            return res.status(404).send("Contest not found");
        }

        
        // if (contest.contestents.user.includes(user._id)) {
        //     userIsRegistered = true;
        // }

        res.render("user/contest-details", { contest, userIsRegistered, isAdmin });
    } catch (error) {
        console.error("Error fetching contest details:", error);
        res.status(500).send("An error occurred");
    }
});
router.get("/compete/:id", isAuthenticated, async (req, res) => {
    const contestID = req.params.id;
    const isAdmin = req.session.user && req.session.user.role === "admin";
    const sessionuser = req.session.user;
    try {
        const contest = await Contest.findById(contestID).populate('questions');
        const user = await User.findOne({ email: sessionuser.email });

        if (!contest) {
            return res.status(404).send("Contest not found");
        }
        res.render("user/compete", { contest, isAdmin });
    } catch (error) {
        console.error("Error fetching contest data:", error);
        res.status(500).send("An error occurred");
    }
});
router.post("/compete/:id", isAuthenticated, async (req, res) => {
    const contestID = req.params.id;
    const isAdmin = req.session.user && req.session.user.role === "admin";
    const sessionuser = req.session.user;

    try {
        const contest = await Contest.findById(contestID).populate('questions');
        const user = await User.findOne({ email: sessionuser.email });

        if (contest) {
            const contest_status = contest.status;
            //contest.registered.push(user._id);
            contest.contestents.push({//Do something to restrict from re-registering
                user: user._id
            });
            user.contestsJoined += 1;
            if (contest_status === "Upcoming") {
                res.json({ result: "registered_upcoming", message: "Congrates! You have been successfully registered. See you in the contest." });
            }
            else {
                res.json({ result: "registered_ongoing", message: "This is a message" })
            }
            await user.save();
            await contest.save();
        } else {
            res.status(404).send("Contest not found");
        }
    } catch (error) {
        console.error("Error registering in contest:", error);
        res.status(500).send("An error occurred");
    }
});

//Contest Problem Section 
router.get("/compete/problems/:contestId/:questionId", isAuthenticated, async (req, res) => {
    const contestId = req.params.contestId;
    const questionId = req.params.questionId;
    const isAdmin = req.session.user && req.session.user.role === "admin";

    try {
        // Fetch the contest and question details using contestId and questionId
        const contest = await Contest.findById(contestId);
        const problem = await Problem.findById(questionId);

        if (contest && problem) {
            res.render("user/contestProblemDetail", { contest, problem, isAdmin });
        } else {
            res.status(404).send("Contest or Problem not found");
        }
    } catch (error) {
        console.error("Error fetching problem details inside compete/problems:", error);
        res.status(500).send("An error occurred");
    }
});

router.get("/compete/problems/prev/:contestId/:problemId", isAuthenticated, async (req, res) => {
    const { contestId, problemId } = req.params;
    const isAdmin = req.session.user && req.session.user.role === "admin";

    try {
        // Find the contest by ID and the current problem
        const contest = await Contest.findById(contestId);
        const currentIndex = contest.questions.findIndex(question => question._id.toString() === problemId);


        if (currentIndex !== -1) {
            let previousIndex = currentIndex - 1;

            if (previousIndex < 0) {
                // If we're on the first problem, loop to the last problem
                previousIndex = contest.questions.length - 1;
            }

            // Fetch the previous problem
            const prevProblemId = contest.questions[previousIndex];
            const prevProblem = await Problem.findById(prevProblemId);
            res.render("user/contestProblemDetail", { contest, problem: prevProblem, isAdmin });
        } else {
            // Handle the case where there is no next problem or an error occurred
            res.status(404).send("No previous problem found or an error occurred");
        }
    } catch (error) {
        console.error("Error fetching previous problem:", error);
        res.status(500).send("An error occurred");
    }
});

router.get("/compete/problems/next/:contestId/:problemId", isAuthenticated, async (req, res) => {
    const { contestId, problemId } = req.params;
    const isAdmin = req.session.user && req.session.user.role === "admin";

    try {
        // Find the contest by ID and the current problem
        const contest = await Contest.findById(contestId);
        const currentIndex = contest.questions.findIndex(question => question._id.toString() === problemId);


        if (currentIndex !== -1) {
            let nextIndex = currentIndex + 1;

            if (nextIndex >= contest.questions.length) {
                // If we're on the last problem, loop to the first problem
                nextIndex = 0;
            }

            // Fetch the next problem
            const nextProblemId = contest.questions[nextIndex];
            const nextProblem = await Problem.findById(nextProblemId);
            res.render("user/contestProblemDetail", { contest, problem: nextProblem, isAdmin });
        } else {
            // Handle the case where there is no next problem or an error occurred
            res.status(404).send("No next problem found or an error occurred");
        }
    } catch (error) {
        console.error("Error fetching next problem:", error);
        res.status(500).send("An error occurred");
    }
});


// Tutorials Section
router.get("/tutorial", isAuthenticated, async (req, res) => {
    try {
        const isAdmin = req.session.user && req.session.user.role === "admin";
        const apiKey = process.env.youtube_api;
        const playlistIds = ['PL23jFe15jxQdCeYWn52pD-gd1goyjKwtW', 'PL03IPd8drN_h5Dw_ovgOQcJ8J0m4m4cFC', 'PL03IPd8drN_hs22sX096hMKV6G_QzXjpy', 'PL03IPd8drN_hOOOtCIfvRa51b11BWnGw3', 'PLkxUHWNJNmL_2j7k8Jsu42mCQMvp6mbpg']; // Add more playlist IDs as needed
        const playlists = [];

        const fetchPlaylistData = (playlistId) => {
            const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&key=${apiKey}`;
            const request = https.get(url, (response) => {
                let data = '';

                response.on('data', (chunk) => {
                    data += chunk;
                });

                response.on('end', () => {
                    if (response.statusCode === 200) {
                        try {
                            const playlistData = JSON.parse(data);
                            const videos = playlistData.items.map((item) => ({
                                title: item.snippet.title,
                                thumbnail: item.snippet.thumbnails.default.url,
                                videoId: item.snippet.resourceId.videoId,
                            }));
                            playlists.push({
                                name: playlistData.items[0].snippet.title,
                                videos,
                            });

                            if (playlists.length === playlistIds.length) {
                                res.render('user/tutorial', { isAdmin, playlists });
                            }
                        } catch (error) {
                            console.error('Error parsing YouTube API response:', error);
                            res.status(500).send('Internal Server Error');
                        }
                    } else {
                        console.error(`YouTube API returned an error for playlist ${playlistId}: ${response.statusCode}`);
                    }
                });
            });

            request.on('error', (error) => {
                console.error('Error fetching YouTube data:', error);
                res.status(500).send('Internal Server Error');
            });

            request.end();
        };

        for (const playlistId of playlistIds) {
            fetchPlaylistData(playlistId);
        }
    } catch (error) {
        console.error('Error fetching YouTube data:', error);
        res.status(500).send('Internal Server Error');
    }
});


//Leaderboard section
router.get("/leaderboard", isAuthenticated, async (req, res) => {
    try {
        const isAdmin = req.session.user && req.session.user.role === "admin";
        const users = await User.find().sort({ totalPoints: -1 });
        res.render("user/leaderboard", { isAdmin, users });
    } catch (error) {
        console.log("Error on rendering leaderboard: ", error);
    }

});

//Event Section
router.get("/event", isAuthenticated, async (req, res) => {
    try {
        const isAdmin = req.session.user && req.session.user.role === "admin";

        // Fetch all events from your MongoDB database
        const events = await Event.find().exec();

        // Render the 'event' template and pass the 'events' array and 'isAdmin' variable
        res.render("user/event", { isAdmin, events });
    } catch (error) {
        console.log("Error on rendering event: ", error);
    }
});

router.get("/event/:id", isAuthenticated, async (req, res) => {
    const eventId = req.params.id;
    const isAdmin = req.session.user && req.session.user.role === "admin";
    try {
        const event = await Event.findById(eventId);
        if (event) {
            res.render("user/eventDetails", { event, isAdmin });
        } else {
            res.status(404).send("Event not found");
        }
    } catch (error) {
        console.error("Error fetching event details:", error);
        res.status(500).send("An error occurred");
    }
});

//Fest Section
router.get("/fest", isAuthenticated, async (req, res) => {
    try {
        const isAdmin = req.session.user && req.session.user.role === "admin";

        // Fetch all events from your MongoDB database
        const fests = await Fest.find();
        const fest = fests[0];

        // Render the 'event' template and pass the 'events' array and 'isAdmin' variable
        res.render("user/fest", { isAdmin, fest });
    } catch (error) {
        console.log("Error on rendering event: ", error);
    }
});
module.exports = router;
