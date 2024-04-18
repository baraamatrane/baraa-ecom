const jwt = require("jsonwebtoken");
const User = require("../Schemas/Userschema");
const Order = require("../Schemas/Ordreschema");
const { v4: uuidv4 } = require("uuid");
const expressAsyncHandler = require("express-async-handler");
const Cart = require("../Schemas/CartItemSchema");
const env = process.env.ACCESS_TOKEN_SECRET;
const Middleware = {
  // ValidateCsrf:expressAsyncHandler(async (req, res, next) => {
  //   try {
  //     const CsrfToken = uuidv4();
  //     if (!CsrfToken) {
  //       return res.status(400).json({ message: "Something Was Wrong!" });
  //     }
  //     req.Csrf = CsrfToken;
  //     next();
  //   } catch (error) {
  //     next(error);
  //   }
  // }),
  // Csrf: expressAsyncHandler(async (req, res, next) => {
  //   try {
  //     const CsrfToken = uuidv4();
  //     if (!CsrfToken) {
  //       return res.status(400).json({ message: "Something Was Wrong!" });
  //     }
  //     req.Csrf = CsrfToken;
  //     next();
  //   } catch (error) {
  //     next(error);
  //   }
  // }),
  verifyJWT: expressAsyncHandler(async (req, res, next) => {
    const token = req.cookies.token;
    try {
      const decoded = jwt.verify(token, env);
      const FindUser = await User.findById(decoded.Userinfo);
      if (!FindUser) {
        return res.status(400).json({ message: "User Not Found" });
      }
      req.user = FindUser;
      req.token = decoded;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError" || !token?.Userinfo) {
        return res.status(401).json({ message: "Token expired" });
      }
    }
  }),
  Cart: expressAsyncHandler(async (req, res, next) => {
    try {
      if (req.cookies.token) {
        const token = jwt.verify(req.cookies.token, env);
        const FindUser = await User.findById(token.Userinfo);
        if (!FindUser) {
          return res.status(400).json({ message: "User Not Found" });
        }
        console.log(FindUser);
        req.user = FindUser;
        next();
      } else {
        if (!req.cookies.guest_id) {
          if (req.originalUrl === "/Cart/Get") {
            return res
              .status(404)
              .json({ message: "Your Cart Is Empty", user: "null" });
          }
        }
        next();
      }
    } catch (error) {
      next(error);
    }
  }),
  Order: expressAsyncHandler(async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Invalid or missing token" });
      }
      const findCart = await Cart.findOne({ user: req.user._id });
      if (!findCart) {
        return res.status(400).json({ message: "User does not have an order" });
      }
      if (findCart?.cartItems.length <= 0) {
        return res.status(400).json({ message: "User does not have an order" });
      }

      req.Cart = findCart;
      next();
    } catch (error) {
      // Handle any errors that may occur during order retrieval
      console.error("Error in OrderMiddleware:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }),
  Admin: expressAsyncHandler(async (req, res, next) => {
    const token = req.cookies.token;
    try {
      const decoded = jwt.verify(token, env);
      if (decoded.Role !== "admin") {
        return res
          .status(401)
          .json({ message: "you can not access to this route" });
      }
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError" || !token?.Userinfo) {
        return res.status(401).json({ message: "Token expired" });
      }
    }
  }),
};

module.exports = Middleware;
