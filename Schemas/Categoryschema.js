const mongoose = require("mongoose");

const Categoryschema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  image: String,
});

const Category = mongoose.model("Category", Categoryschema);

module.exports = Category;
