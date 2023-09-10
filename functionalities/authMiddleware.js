const auth = require("./firebase");

function requireAuth(req, res, next) {
    if (req.originalUrl === '/home' || auth.currentUser) {
        next();
    } else {
        res.redirect("/login");
    }
}

module.exports = requireAuth;
