const express = require("express");
const { Cart } = require("../Midlwares/Autorize.js");
const Route = express.Router();
const validator = require("../validation/valadation.js");
const cartItem = require("../Schemas/CartItemSchema.js");
const CartItemControlers = require("../Controlers/CartItemControlers.js");
const jwt = require("jsonwebtoken");
const Userschema = require("../Schemas/Userschema.js");
// Get All CartItem with User Id
Route.use(Cart); // GET Cart item for user
Route.get("/Get", CartItemControlers.GetcartItem);
Route.get(
  "/:id",
  validator.GetCart,
  validator.Middleware,
  CartItemControlers.Getspesific
);
Route.use(CartItemControlers.Middleware);
Route.post(
  "/Add",
  validator.AddCartItem,
  validator.Middleware,
  CartItemControlers.Add
);

Route.delete(
  "/:id",
  validator.UpdateCartItem,
  validator.Middleware,
  CartItemControlers.Delete
);
Route.put(
  "/:id",
  validator.UpdateCartItem,
  validator.Middleware,
  CartItemControlers.Update
);

module.exports = Route;
