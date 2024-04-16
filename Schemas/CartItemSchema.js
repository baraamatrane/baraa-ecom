const mongoose = require("mongoose");
const Userschema = require("./Userschema");

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User", // Reference to the User model if you have one
    default: null,
  },
  cartItems: [
    {
      product: {
        type: mongoose.Schema.ObjectId,
        ref: "Product",
      },
      quantity: { type: Number, default: 1 },
      color: String,
    },
  ],
  CartTotalPrice: {
    type: Number,
    default: 0,
  },
  CartTotalItems: {
    type: Number,
    default: 0,
  },
});

cartSchema.pre(/^find/, function (next) {
  this.populate({
    path: "cartItems.product",
    select: "price title sold priceAfterDiscount imageCover category",
  });
  this.populate({
    path: "user",
    select: "address email lastName firstName",
  });
  next();
});

module.exports = mongoose.model("Cart", cartSchema);
