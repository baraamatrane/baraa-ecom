const express = require("express");
const Route = express.Router();
const Middleware = require("../Midlwares/Autorize.js");
const validator = require("../validation/valadation.js");
const Order = require("../Schemas/Ordreschema.js");
const Ordercontroller = require("../Controlers/OrderControlers.js");
const jwt = require("jsonwebtoken");
const expressAsyncHandler = require("express-async-handler");
// Get All Order For User
Route.use(Middleware.verifyJWT);

Route.get("/GetUser", Ordercontroller.GetUser);
// Get All Order For Admin
Route.get("/Get", Ordercontroller.GetOrder);
// Get specific Order For admin
Route.get(
  "/:id",
  validator.IdOrder,
  validator.Middleware,
  Ordercontroller.Getspesific
);
// Add Ordre Cash
Route.use(Middleware.Order);
Route.post(
  "/AddCash",
  validator.CheckAddress,
  validator.Middleware,
  Ordercontroller.AddCash
);

// Payment with cart
Route.post("/PaymentOrder", Ordercontroller.PaymentOrder);
// Stripe checkout page
Route.get("/Stripe/StripeCheckout", Ordercontroller.StripeCheckout);
// Delete
Route.delete(
  "/:id",
  validator.FindOrder,
  validator.Middleware,
  Ordercontroller.Delete
);

module.exports = Route;
// YOU ARE COMPLETE BACK-END
// ADD DATA
