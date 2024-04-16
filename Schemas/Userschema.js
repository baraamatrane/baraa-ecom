const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    address: {
      address: String,
      city: String,
      phone: String,
    },

    createdDate: {
      type: Date,
      default: Date.now,
    },
    Role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },

    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
    wishlist: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
      ],
      default: [],
    },
    IPaddress: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);
module.exports = mongoose.model("User", userSchema);
