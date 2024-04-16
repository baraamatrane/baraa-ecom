const Order = require("../Schemas/Ordreschema.js");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const CartSchema = require("../Schemas/CartItemSchema.js");
const Date = (Date) => {
  return moment().add(Date, "days").format("MMMM Do");
};
const stripe = require("stripe")(process.env.Stripe_Token);
// const mongoose = require("mongoose");
// const ProductSchema = require("../Schemas/Productschema.js");
const async_handler = require("express-async-handler");
const CartReset = async (req, res) => {
  const DeleteCartItem = await CartSchema.findOneAndUpdate(
    {
      user: req.user._id,
    },
    {
      $set: {
        cartItems: [],
        CartTotalItems: 0,
        CartTotalPrice: 0,
      },
    },
    { new: true }
  );
  if (!DeleteCartItem) {
    return res.status(200).json({ messsage: "An error Occure!" });
  }
};
const Ordercontroller = {
  GetUser: async_handler(async (req, res) => {
    const FindOrder = await Order.find({ user: req.user._id });
    return res.status(200).json({ result: FindOrder.length, FindOrder });
  }),
  GetOrder: async_handler(async (req, res) => {
    console.log(
      "date is ,:",
      moment().add(2, "days").format("MMMM Do YYYY, h:mm:ss a")
    );
    const FindOrder = await Order.find({});
    return res.status(200).json({ result: FindOrder.length, FindOrder });
  }),
  Getspesific: async_handler(async (req, res) => {
    const { IdOrder } = req;
    if (!IdOrder) {
      return res.status(404).json({ message: "Order Not Found" });
    }
    return res.status(200).json({ IdOrder });
  }),
  PaymentOrder: async_handler(async (req, res, next) => {
    try {
      const { address } = req.body;
      const { Cart } = req;
      console.log(Cart);
      const taxPrice = 0;
      const deliveredAt = `${Date(3)} and ${Date(6)}`;
      const defaultShippingPrice = 20;
      const CreateOrder = await Order.create({
        user: req.user._id,
        status: "Processing",
        taxPrice,
        OrderQuantity: Cart.CartTotalItems,
        cartItems: Cart.cartItems,
        shippingAddress: address,
        paymentMethodType: "card",
        shippingPrice: defaultShippingPrice,
        isPaid: true,
        totalOrderPrice: taxPrice + Cart.CartTotalPrice + defaultShippingPrice,
        deliveredAt,
      });

      if (!CreateOrder) {
        return res.status(400).json({
          message: "An error occurred while creating the order",
        });
      }
      await CartReset(req, res);
      return res.status(200).json({ CreateOrder });
    } catch (error) {
      console.error("Error creating cash order:", error);
      next(error);
    }
  }),
  AddCash: async_handler(async (req, res, next) => {
    try {
      const { address } = req.body;
      const { Cart } = req;
      const taxPrice = 0;
      const deliveredAt = `${Date(3)} and ${Date(6)}`;
      const defaultShippingPrice = 20;
      console.log(address);
      const CreateOrder = await Order.create({
        user: req.user._id,
        status: "Processing",
        taxPrice,
        OrderQuantity: Cart.CartTotalItems,
        cartItems: Cart.cartItems,
        shippingAddress: address,
        shippingPrice: defaultShippingPrice,
        isPaid: false,
        totalOrderPrice: taxPrice + Cart.CartTotalPrice + defaultShippingPrice,
        deliveredAt,
      });

      if (!CreateOrder) {
        return res
          .status(400)
          .json({ message: "An error occurred while creating the order" });
      }
      await CartReset(req, res);
      return res.status(200).json({ CreateOrder });
    } catch (error) {
      console.error("Error creating cash order:", error);
      next(error);
    }
  }),
  StripeCheckout: async_handler(async (req, res, next) => {
    try {
      const { Cart } = req;
      const defaultShippingPrice = 2000;
      const line_items = Cart.cartItems.map((item) => {
        return {
          price_data: {
            currency: "usd",
            unit_amount: item.product.price * 100,
            product_data: {
              name: item.product.title,
              images: [
                `${req.protocol}://${req.get("host")}/Product/Images${
                  item.product.imageCover
                }`,
              ],
            },
          },
          quantity: item.quantity,
        };
      });
      const data = encodeURIComponent(
        JSON.stringify({
          address: Cart.user.address,
        })
      );
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items,
        mode: "payment",
        shipping_options: [
          {
            shipping_rate_data: {
              type: "fixed_amount",
              display_name: "Shipping",
              fixed_amount: {
                amount: defaultShippingPrice,
                currency: "usd",
              },
            },
          },
        ],
        automatic_tax: {
          enabled: true,
        },
        success_url: `http://localhost:3000/Thank-you?data=${data}`,
        cancel_url: `http://localhost:3000`,
      });
      console.log(session);
      if (!session) {
        return res.status(500).json({ message: "an error while payment!" });
      }
      return res.status(200).json({ url: session.url });
    } catch (error) {
      next(error);
    }
  }),

  Delete: async_handler(async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Order id is required" });
      }
      const DeletedOrder = await Order.findOneAndDelete({
        user: req.user._id,
        _id: id,
      });
      if (!DeletedOrder) {
        return res
          .status(400)
          .json({ message: "An error Occure while Deleting!" });
      }
      return res.status(200).json({ message: "Order deleted successfully" });
    } catch (error) {
      return res.status(500).json(error);
    }
  }),
};

module.exports = Ordercontroller;
