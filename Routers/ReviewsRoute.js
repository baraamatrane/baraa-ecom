const express = require("express");
const Route = express.Router();
const validator = require("../validation/valadation.js");
const Reviewcontroller = require("../Controlers/ReviewControlers.js");
const Middleware = require("../Midlwares/Autorize.js");

Route.get("/Get", Reviewcontroller.GetReview);
Route.get(
  "/:id",
  validator.IdReview,
  validator.Middleware,
  Reviewcontroller.Getspesific
);
Route.use(Middleware.verifyJWT);
Route.post(
  "/Add",
  validator.AddReview,
  validator.Middleware,
  Reviewcontroller.Add
);
Route.delete(
  "/:id",
  validator.IdReview,
  validator.Middleware,
  Reviewcontroller.Delete
);
Route.put(
  "/:id",
  validator.AddReview,
  validator.IdReview,
  validator.Middleware,
  Reviewcontroller.Update
);

module.exports = Route;
