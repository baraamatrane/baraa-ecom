// reviewSchema.js
const mongoose = require("mongoose");

const reviewSchema = mongoose.Schema(
  {
    title: {
      type: String,
    },
    ratings: {
      type: Number,
      min: [1, "Min ratings value is 1.0"],
      max: [5, "Max ratings value is 5.0"],
      required: [true, "Review ratings required"],
    },
    User: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to user"],
    },
    // parent reference (one to many)
    Product: {
      type: mongoose.Schema.ObjectId,
      ref: "Product",
      required: [true, "Review must belong to product"],
    },
  },
  { timestamps: true }
);
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "User",
    select: "firstName lastName",
  });
  next();
});

module.exports = mongoose.model("Review", reviewSchema);
