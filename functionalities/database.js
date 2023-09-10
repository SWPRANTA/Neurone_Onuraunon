
const mongoose = require("mongoose");
const http = require("http")
const link = "mongodb+srv://SWPRANTA04:EqsU4PgVzCx2CrRX@neurone-onuraunon.4oqzaaj.mongodb.net/?retryWrites=true&w=majority"
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
