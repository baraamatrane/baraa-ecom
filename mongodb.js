const mongoose = require("mongoose");
const dbName = "e-commerce";
const url = `mongodb+srv://baraa:baraa12345@e-commerce.qiembtu.mongodb.net/${dbName}`;

const connect = mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;

module.exports = db;
