const mongoose = require("mongoose");
const xlsx = require('xlsx');

mongoose
    .connect("mongodb://127.0.0.1:27017/neurone_onuraunon", { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("mongoose started");

        // Drop the entire database
        return mongoose.connection.db.dropDatabase();
    })
    .then(() => {
        console.log("Database dropped");

        const problemSchema = new mongoose.Schema({
            title: {
                type: String,
                required: true
            },
            statement: {
                type: String,
                required: true
            },
            solution: {
                type: String,
                required: true
            },
            points: {
                type: Number,
                required: true
            }
        });

        const Problem = mongoose.model("Problem", problemSchema);
        const workbook = xlsx.readFile('Problems Details.xlsx');
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        const desiredColumns = ['Title', 'Statement', 'Solution', 'Points'];
        const excelData = xlsx.utils.sheet_to_json(worksheet, { header: desiredColumns, range: 1 });

        const columnData = {
            'Title': 'title',
            'Statement': 'statement',
            'Solution': 'solution',
            'Points': 'points'
        };

        const mappedData = excelData.map((row) => {
            const mappedRow = {};
            for (const column of desiredColumns) {
                const field = columnData[column];
                mappedRow[field] = row[column];
            }
            return mappedRow;
        });
        // Insert data into the new database
        return Problem.insertMany(mappedData);
    })
    .then((docs) => {
        console.log('Documents inserted successfully: ', docs);
    })
    .then(() => {
        // Define the user schema
        const userSchema = new mongoose.Schema({
            name: {
                type: String,
                required: true
            },
            email: {
                type: String,
                required: true
            },
            password: {
                type: String,
                required: true
            },
            problemsSolved: {
                type: Number,
                default: 0
            },
            contestsJoined: {
                type: Number,
                default: 0
            },
            imageLink: {
                type: String,
                default: ''
            }
        });

        const User = mongoose.model("User", userSchema);

        return User.createCollection();
    })
    .then((user) => {
        console.log('User created: ', user);

        // Close the MongoDB connection
        mongoose.connection.close();
    })
    .catch((err) => {
        console.log('Error: ', err);
    });
