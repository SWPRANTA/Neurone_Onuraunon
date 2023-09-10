
const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  statement: { type: String, required: true },
  solution: { type: String, required: true },
  points: { type: Number, required: true },
});

const Problem = mongoose.model("Problem", problemSchema);

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  problemsSolved: { type: Number, default: 0 },
  contestsJoined: { type: Number, default: 0 },
  imageLink: { type: String, default: "" },
});

const User = mongoose.model("User", userSchema);

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  imageUrl: { type: String, required: true },
});

const Blog = mongoose.model("Blog", blogSchema);

module.exports = {
  Problem,
  User,
  Blog,
};
