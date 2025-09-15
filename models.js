// models.js
const mongoose = require("mongoose");

// --- User Schema ---
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 3,
  },
  phonenumber: {
    type: String,
    required: true,
    match: /^\d{10}$/,   // ✅ must be 10 digits
    unique: true,
  },
  dob: {
    type: Date,
    required: true,
  },
  aadhar: {
    type: String,
    required: true,
    match: /^\d{12}$/,   // ✅ must be 12 digits
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
});

// --- UserLand Schema ---
const userLandSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  landLocation: {
    type: String,
    required: true,
  },
  landSize: {
    type: Number,
    required: true,
    min: 1,
  },
  landType: {
    type: String,
    required: true,
  },
  waterSource: {
    type: String,
    default: "Unknown",
  },
  cropDetails: {
    type: String,
    default: "",
  },
});

// --- Export Models ---
const User = mongoose.model("User", userSchema);
const UserLand = mongoose.model("UserLand", userLandSchema);

module.exports = { User, UserLand };
