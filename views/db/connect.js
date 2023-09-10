const mongoose = require('mongoose');
const uri = "mongodb+srv://neurone_onuraunon:Ps7jA2UvpZiVwHDu@neurone-onuraunon.vwkkfa3.mongodb.net/Neurone-Onuraunon?retryWrites=true&w=majority";
const connectDB = () =>{
    return mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
}

module.exports = connectDB;