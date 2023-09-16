const mongoose = require("mongoose");
const http = require("http")
const link = "mongodb+srv://SWPRANTA04:EqsU4PgVzCx2CrRX@neurone-onuraunon.4oqzaaj.mongodb.net/?retryWrites=true&w=majority"
mongoose
    .connect(link, { useNewUrlParser: true, useUnifiedTopology: true })

    .then(async () => {
        // const userSchema = new mongoose.Schema({
        //     name: {
        //         type: String,
        //         required: true
        //     },
        //     role:{
        //         type: String,
        //         required: true
        //     },
        //     email: {
        //         type: String,
        //         required: true
        //     },
        //     password: {
        //         type: String,
        //         required: true
        //     },
        //     problemsSolved: {
        //         type: Number,
        //         default: 0
        //     },
        //     contestsJoined: {
        //         type: Number,
        //         default: 0
        //     },
        //     imageLink: {
        //         type: String,
        //         default: ''
        //     }
        // });

        // const User = mongoose.model("User", userSchema);

        // const dummyUser = new User({
        //     name: "admin@04",
        //     role: "admin",
        //     email: "200204@ku.ac.bd",
        //     password: "admin0304"
        // });

        // // Save the dummy user to the database
        // await dummyUser.save();

        const notificationSchema = new mongoose.Schema({
            requesterUserId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: 'User', // Assuming you have a User model
            },
            adminUserId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            blogTitle: {
                type: String,
                required: true,
            },
            description: {
                type: String,
                required: true,
            },
            imageUrl: {
                type: String,
            },
            status: {
                type: String,
                enum: ['pending', 'accepted', 'rejected'],
                default: 'pending',
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
            updatedAt: {
                type: Date,
                default: Date.now,
            },
        });

        const Notification = mongoose.model('Notification', notificationSchema);

        module.exports = Notification;

    })
    .then((user) => {
        console.log('User created: ', user);
        mongoose.connection.close();
    })
    .catch((err) => {
        console.log('Error: ', err);
    });
