
const { initializeApp } = require("firebase/app");
const { getAuth } = require("firebase/auth");

const firebaseConfig = {
    
};

const appFirebase = initializeApp(firebaseConfig);
const auth = getAuth(appFirebase);

module.exports = auth;
