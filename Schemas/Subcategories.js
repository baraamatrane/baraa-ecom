const mongoose = require("mongoose");

const Subcategoryschema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    unique: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
  },
  image: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Subcategory = mongoose.model("Subcategories", Subcategoryschema);

module.exports = Subcategory;
