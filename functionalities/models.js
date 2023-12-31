
const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema({
  title: {type: String, required: true},
  statement: {type: String, required: true},
  solution: {type: String, required: true},
  points: {type: Number, required: true},
  solved_count: {type: Number, default: 0},
  attempt: {type: Number, default: 0}
});

const Problem = mongoose.model("Problem", problemSchema);

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role:{type: String, required: true},
  email: { type: String, required: true },
  password: { type: String, required: true },
  problemsSolved: { type: Number, default: 0 },
  problemAttempted: {type: Number, default: 0},
  contestsJoined: { type: Number, default: 0 },
  totalPoints: {type: Number, default: 0},
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

const notificationSchema = new mongoose.Schema({
  // requesterUserId: {
  //     type: mongoose.Schema.Types.ObjectId,
  //     required: true,
  //     ref: 'User', // Assuming you have a User model
  // },
  // adminUserId: {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: 'User',
  // },
  blogTitle: {type: String, required: true,},
  description: {type: String, required: true,},
  imageUrl: {type: String,},
  status: {type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending',},
  createdAt: {type: Date, required: true}
});

const Notification = mongoose.model('Notification', notificationSchema);

const contestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true }],
  createdAt: { type: Date, required: true },
  publish: { type: Boolean, required: true },
  //registered: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
  contestents: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    attempts: { type: Number, default: 0 },
    solved: { type: Number, default: 0 }
  }]
});

// Define a virtual field to determine contest status
contestSchema.virtual('status').get(function () {
  const now = new Date();
  if (now < this.startTime) {
    return 'Upcoming';
  } else if (now >= this.startTime && now <= this.endTime) {
    return 'Running';
  } else {
    return 'Finished';
  }
});

// Apply the virtual field to the schema
contestSchema.set('toObject', { virtuals: true });
contestSchema.set('toJSON', { virtuals: true });

const Contest = mongoose.model("Contest", contestSchema);

//Event Schema
const eventSchema = new mongoose.Schema({
  eventTitle: {type: String, required: true,},
  location: {type: String, required: true},
  startTime: {type: Date, required: true},
  endTime: { type: Date, required: true },
  description: {type: String, required: true,},
  imageUrl: [{type: String,}],
});

eventSchema.virtual('status').get(function () {
  const now = new Date();
  if (now < this.startTime) {
    return 'Upcoming';
  } else if (now >= this.startTime && now <= this.endTime) {
    return 'Ongoing';
  } else {
    return 'Previous';
  }
});

eventSchema.set('toObject', { virtuals: true });
eventSchema.set('toJSON', { virtuals: true });

const Event = mongoose.model("Event", eventSchema);


//Fest Schema
const festSchema = new mongoose.Schema({
  festTitle: {type: String, required: true,},
  location: {type: String, required: true},
  startTime: {type: Date, required: true},
  description: {type: String, required: true,},
  imageUrl: [{type: String,}],
});

festSchema.virtual('status').get(function () {
  const now = new Date();
  if (now < this.startTime) {
    return 'Upcoming';
  } else {
    return 'Previous';
  }
});

festSchema.set('toObject', { virtuals: true });
festSchema.set('toJSON', { virtuals: true });

const Fest = mongoose.model("Fest", festSchema);


module.exports = {
  Problem,
  User,
  Blog,
  Notification,
  Contest,
  Event,
  Fest
};
