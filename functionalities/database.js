require('dotenv').config();
const mongoose = require("mongoose");
const http = require("http")
const link = process.env.database_url;
mongoose
  .connect(link, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("mongoose started");
  })
  .catch((err) => {
    console.log("Error: ", err);
  });

module.exports = mongoose;
