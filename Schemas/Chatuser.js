const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  Chat: {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
    },
    createdDate: {
      type: Date,
      default: Date.now,
    },
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
  },
});

const DB = mongoose.model("Chat", userSchema);

module.exports = DB;
