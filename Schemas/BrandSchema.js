const mongoose = require("mongoose");

const Brandschema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  image: String,
});

module.exports = mongoose.model("Brand", Brandschema);
