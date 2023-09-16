
const { initializeApp } = require("firebase/app");
const { getAuth } = require("firebase/auth");

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

module.exports = auth;
