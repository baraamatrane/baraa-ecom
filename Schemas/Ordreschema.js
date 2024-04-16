const mongoose = require("mongoose");

const Order = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      unique: false,
      required: [true, "Order must belong to a user"],
    },
    cartItems: [
      {
        product: {
          type: mongoose.Schema.ObjectId,
          ref: "Product",
        },
        quantity: { type: Number, default: 0 },
        color: String,
      },
    ],
    OrderQuantity: {
      type: Number,
      default: 0,
    },
    taxPrice: {
      type: Number,
      default: 0,
    },
    shippingAddress: {
      phone: String,
      address: String,
      city: String,
    },
    shippingPrice: {
      type: Number,
      default: 0,
    },
    totalOrderPrice: {
      type: Number,
      default: 0,
    },
    paymentMethodType: {
      type: String,
      enum: ["card", "cash"],
      default: "cash",
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: Date,
    isDelivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: String,
    status: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
  },
  { timestamps: true }
);
Order.pre(/^find/, function (next) {
  this.populate({
    path: "cartItems.product",
    select: "imageCover title price",
  });
  this.populate({
    path: "cartItems",
    select: "quantity",
  });
  this.populate({
    path: "user",
    select: "address email lastName firstName",
  });
  next();
});

module.exports = mongoose.model("Order", Order);
