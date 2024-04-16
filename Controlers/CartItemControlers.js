const Cart = require("../Schemas/CartItemSchema.js");
const jwt = require("jsonwebtoken");
// const mongoose = require("mongoose");
// const ProductSchema = require("../Schemas/Productschema.js");
const async_handler = require("express-async-handler");
const { default: mongoose } = require("mongoose");
const CartItemcontroller = {
  Middleware: async_handler(async (req, res, next) => {
    if (req.cookies?.guest_id) {
      const user = new mongoose.Types.ObjectId(
        req.user?._id || req?.guest_id || req.cookies?.guest_id
      );
      const FindCartItem = await Cart.findOne({
        $or: [
          { user: user }, // Replace userId with the actual user ID
          { _id: user }, // Replace objectId with the actual ObjectId
        ],
      });
      if (!FindCartItem) {
        return res
          .status(200)
          .clearCookie("guest_id")
          .json({ message: "The Cart not Found" });
      }
    }
    next();
  }),
  GetcartItem: async_handler(async (req, res) => {
    const user = new mongoose.Types.ObjectId(
      req.user?._id || req?.guest_id || req.cookies?.guest_id
    );
    const FindCartItem = await Cart.findOne({
      $or: [
        { user: user }, // Replace userId with the actual user ID
        { _id: user }, // Replace objectId with the actual ObjectId
      ],
    });

    if (!FindCartItem || FindCartItem.cartItems.length === 0) {
      return res
        .status(200)
        .json({ message: "Your Cart is empty", user: FindCartItem });
    }
    return res.status(200).json({ FindCartItem });
  }),
  Getspesific: async_handler(async (req, res) => {
    return res.status(200).json({ Cart: req.Cart });
  }),
  CreateCashOrdre: async_handler(async (req, res, next) => {
    try {
      const { product, color, quantity } = req.body;
      const { Product } = req;
      const cartItems = {
        product,
        color,
        quantity,
        price: Product.price,
      };
      const CreateCart = await Cart.create(
        { user: req.user._id },
        {
          $push: { cartItems },
          $inc: {
            OrderQuantity: 1,
            totalOrderPrice: Product.price,
          },
        },
        { new: true }
      );
      const user = req.user._id || req.cookies.guest_id;
      const CreateCartItem = await CartItem.create({
        user,
      });
      if (!CreateCartItem) {
        return res
          .status(400)
          .json({ message: "An error occurred while creating the CartItem" })
          .cookie("token", token, {
            SameSite: true,
            HttpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
          });
      }

      return res.status(200).json({ CreateCartItem });
    } catch (error) {
      // Log or handle the error more explicitly
      console.error("Error creating cash CartItem:", error);
      next(error);
    }
  }),

  RemoveCartItem: async_handler(async (req, res, next) => {
    try {
      const { cartItems } = req.body;
      if (!cartItems) {
        res.status(400).json({ message: "All data Is required" });
      }
      const token = jwt.decode(req.cookies.token);
      if (!token) {
        return res.status(401).json({ message: "Invalid or missing token" });
      }
      const Productprice = cartItems.map((item) => {
        return item.price * item.quantity;
      });
      const totalPrice = Productprice.reduce(
        (accumulator, currentValue) => accumulator + currentValue,
        0
      );
      const CreateCartItem = await CartItem.findOneAndUpdate(
        { user: token.Userinfo },
        {
          $addToSet: {
            cartItems: { $each: cartItems },
          },
          $inc: {
            totalCartItemPrice: totalPrice,
          },
        },
        { new: true, upsert: true }
      );

      if (!CreateCartItem) {
        return res.status(400).json({ message: "An error occure!" });
      }
      return res.status(200).json({ CreateCartItem });
    } catch (error) {
      next(error);
    }
  }),
  AddCartItem: async_handler(async (req, res, next) => {
    try {
      const { cartItems } = req.body;
      if (cartItems.length !== 1) {
        return res.status(400).json({ message: "All data is required" });
      }

      const token = jwt.decode(req.cookies.token);
      if (!token) {
        return res.status(401).json({ message: "Invalid or missing token" });
      }

      const CreateCartItem = await CartItem.findOneAndUpdate(
        { user: token.Userinfo },
        {
          $addToSet: { cartItems: { $each: cartItems } },
          $inc: {
            CartItemQuantity: cartItems[0].quantity,
            totalCartItemPrice: cartItems[0].quantity * cartItems[0].price,
          },
        },
        { new: true }
      );
      console.log(CreateCartItem);
      if (!CreateCartItem) {
        return res
          .status(400)
          .json({ message: "An error occurred while creating the CartItem" });
      }

      return res.status(200).json({ CreateCartItem });
      // }

      // return res.status(200).json({ FindProduct });
    } catch (error) {
      next(error);
    }
  }),

  Add: async_handler(async (req, res, next) => {
    try {
      const { product, color, quantity } = req.body;
      const { Product } = req;
      const cartItems = {
        product,
        color,
        quantity,
        price: Product.price,
      };
      const guest_id = new mongoose.Types.ObjectId(
        req.user?._id || req?.guest_id || req.cookies?.guest_id
      );
      const user = new mongoose.Types.ObjectId(req.user?._id || null);
      console.log(user);
      const FindCartProduct = await Cart.findOneAndUpdate(
        {
          $or: [{ user: user }, { _id: guest_id }],
          "cartItems.product": product,
        },
        {
          $inc: {
            "cartItems.$.quantity": quantity,
            CartTotalItems: quantity,
            CartTotalPrice: Product.price * quantity,
          },
        },
        {
          new: true,
        }
      );
      if (FindCartProduct) {
        return res.status(201).json({
          message: "Product Is Already in Cart",
          CreateCartItem: FindCartProduct,
        });
      }
      console.log(user);
      const CreateCartItem = await Cart.findOneAndUpdate(
        {
          $or: [{ user: user }, { _id: guest_id }],
        },
        {
          user,
          $addToSet: {
            cartItems: {
              product: Product._id,
              color: color,
              quantity,
            },
          },
          $inc: {
            CartTotalItems: quantity,
            CartTotalPrice: Product.price * quantity,
          },
        },
        { upsert: true, new: true }
      );

      console.log(CreateCartItem);
      if (!CreateCartItem) {
        return res
          .status(400)
          .json({ message: "An error occurred while creating the CartItem" });
      }
      if (!req.cookies.guest_id && !req.cookies.token) {
        console.log(CreateCartItem._id);
        return res
          .cookie("guest_id", CreateCartItem._id.toString(), {
            sameSite: true,
            httpOnly: true,
            secure: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
          })
          .status(200)
          .json({ CreateCartItem });
      }
      return res.status(200).json({ CreateCartItem });
      // }

      // return res.status(200).json({ FindProduct });
    } catch (error) {
      next(error);
    }
  }),

  Delete: async_handler(async (req, res, next) => {
    try {
      const { id } = req.params;
      const { Product } = req;
      if (!id) {
        return res.status(400).json({ message: "CartItem id is required" });
      }
      const user = new mongoose.Types.ObjectId(
        req.user?._id || req?.guest_id || req.cookies?.guest_id
      );
      console.log(
        "PRoduct ::: ..............",
        Product.product.price,
        Product.quantity
      );
      const _id = new mongoose.Types.ObjectId(id);
      const DeleteCartItem = await Cart.findOneAndUpdate(
        { $or: [{ user: user }, { _id: user }] },
        {
          $pull: { cartItems: { _id } },
          $inc: {
            CartTotalItems: -Product.quantity,
            CartTotalPrice: -(Product.product.price * Product.quantity), // Multiply by -1 to subtract
          },
        },
        {
          new: true,
        }
      );

      if (!DeleteCartItem) {
        return res.status(400).json({ message: "CartItem Not found" });
      }
      if (DeleteCartItem.cartItems.length === 0) {
        return res.status(200).json({ message: "Your Cart is empty" });
      }
      return res
        .status(200)
        .json({ message: "CartItem deleted successfully", DeleteCartItem });
    } catch (error) {
      next(error);
    }
  }),
  Update: async_handler(async (req, res, next) => {
    try {
      const { id } = req.params;
      const { quantity } = req.body;
      const { Product } = req;
      if (!id) {
        return res.status(400).json({ message: "CartItem id is required" });
      }
      const user = new mongoose.Types.ObjectId(
        req.user?._id || req?.guest_id || req.cookies?.guest_id
      );
      const Modify =
        Product.quantity + quantity <= 0
          ? {
              $pull: { cartItems: { _id: new mongoose.Types.ObjectId(id) } },
              $inc: {
                CartTotalItems: quantity,
                CartTotalPrice: Product.product.price * quantity,
              },
            }
          : {
              $inc: {
                "cartItems.$.quantity": quantity,
                CartTotalItems: quantity,
                CartTotalPrice: Product.product.price * quantity,
              },
            };
      const UpdateCartItem = await Cart.findOneAndUpdate(
        {
          $or: [{ user: user }, { _id: user }],
          "cartItems._id": new mongoose.Types.ObjectId(id),
        },
        Modify,
        { new: true }
      );

      if (!UpdateCartItem) {
        return res.status(400).json({ message: "CartItem Not found" });
      }
      return res
        .status(200)
        .json({ UpdateCartItem, message: "CartItem updated successfully" });
    } catch (error) {
      next(error);
    }
  }),
};

module.exports = CartItemcontroller;
