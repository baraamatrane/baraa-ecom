const DB = require("../Schemas/Userschema");
const jwt = require("jsonwebtoken");
const async_handler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const env = require("dotenv").config();
const Usercontroler = {
  Register: async_handler(async (req, res, next) => {
    try {
      const { firstName, lastName, email, password, Role } = req.body;
      const UpdateRole = { Role: Role } || { Role: "user" };
      const ipAddress =
        req.headers["x-forwarded-for"] || req.connection.remoteAddress;
      if (!firstName || !lastName || !email || !password) {
        return next("all fields are required");
      }
      const existuser = await DB.findOne({ email: email });
      if (existuser) {
        res.status(401).json({ message: "User already exist" });
        return;
      }
      const Hashpassword = await bcrypt.hash(password, 12);
      const Createuser = await DB.create({
        firstName,
        lastName,
        email,
        password,
        password: Hashpassword,
        UpdateRole,
        IPaddress: ipAddress,
      });
      const token = jwt.sign(
        { Userinfo: Createuser._id, UpdateRole },
        env.parsed.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "24h",
        }
      );
      res.cookie("token", token, {
        SameSite: true,
        HttpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      });
      return res.status(201).json({ data: Createuser, token });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }),
  AddWishlist: async_handler(async (req, res, next) => {
    try {
      console.log(req.cookies);
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Id is required" });
      }

      const token = jwt.decode(req.cookies.token);
      if (!token) {
        return res.status(401).json({ message: "Invalid or missing token" });
      }
      const updatedUser = await DB.findOneAndUpdate(
        { _id: token.Userinfo }, // Assuming your user ID field is _id
        { $push: { wishlist: id } },
        { new: true }
      ).populate({
        path: "wishlist",
        model: "Product",
        select:
          "imageCover title sold price ratingsQuantity ratingsAverage colors",
      });

      if (!updatedUser) {
        return res.status(400).json({ message: "An error occurred!" });
      }

      // Respond with only the necessary information, not the entire user object
      const { wishlist, _id, firstName, lastName, email } = updatedUser;

      return res.status(200).json({
        wishlist,
        user: { _id, firstName, lastName, email },
      });
    } catch (error) {
      next(error);
    }
  }),
  DeleteWishlist: async_handler(async (req, res, next) => {
    try {
      console.log(req.cookies);
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Id is required" });
      }

      const token = jwt.decode(req.cookies.token);
      if (!token) {
        return res.status(401).json({ message: "Invalid or missing token" });
      }
      const updatedUser = await DB.findOneAndUpdate(
        { _id: token.Userinfo }, // Assuming your user ID field is _id
        { $pull: { wishlist: id } },
        { new: true }
      ).populate({
        path: "wishlist",
        model: "Product",
        select:
          "imageCover title sold price ratingsQuantity ratingsAverage colors",
      });

      if (!updatedUser) {
        return res.status(400).json({ message: "An error occurred!" });
      }
      return res.status(200).json({
        message: "Wishlist Deleted sucssefully",
        Wishlist: updatedUser.wishlist,
      });
    } catch (error) {
      next(error);
    }
  }),
  GetWishlist: async_handler(async (req, res, next) => {
    try {
      const token = jwt.decode(req.cookies.token);
      if (!token) {
        return res.status(401).json({ message: "Invalid or missing token" });
      }
      const FindWishlist = await DB.findById(token.Userinfo).populate({
        path: "wishlist",
        model: "Product",
        select:
          "imageCover title sold price ratingsQuantity ratingsAverage colors",
      });
      if (!FindWishlist.wishlist) {
        return res.status(400).json({ message: "An error occure!" });
      }
      return res.status(200).json({ Wishlist: FindWishlist.wishlist });
    } catch (error) {
      next(error);
    }
  }),
  Information: async_handler(async (req, res, next) => {
    return res.status(200).json({ user: req.user });
  }),
  login: async_handler(async (req, res, next) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(402).json({ message: "all field are required ! " });
      }

      const existuser = await DB.findOne({ email: email });

      if (!existuser)
        return res.status(401).json({ message: "User Not exist" });

      const Comparepassword = await bcrypt.compare(
        password,
        existuser.password
      );

      if (!Comparepassword) {
        return res.status(400).json({ message: "Password incorrect " });
      }

      const token = jwt.sign(
        { Userinfo: existuser._id, Role: existuser.Role },
        env.parsed.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "24h",
        }
      );
      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 24 * 60 * 60 * 1000,
      });
      return res.status(200).json({ data: existuser, token });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }),
  Changepassword: async_handler(async (req, res, next) => {
    try {
      const { newpassword, password, confirmpassword } = req.body;
      if (!password || !newpassword || !confirmpassword) {
        return res.status(400).json({ message: "Password required" });
      }
      if (newpassword !== confirmpassword) {
        return res.status(400).json({ message: "ConfirmPassword incorrect" });
      }

      const token = jwt.decode(req.cookies.token);

      if (!token) {
        return res.status(401).json({ message: "Invalid or missing token" });
      }

      const user = await DB.findById(token.Userinfo);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const Comparepassword = await bcrypt.compare(password, user.password);
      if (!Comparepassword)
        return res.status(400).json({ message: "Incorect password" });
      const NewBycritPassword = await bcrypt.hash(confirmpassword, 12);
      const Changepass = await DB.findByIdAndUpdate(token.Userinfo, {
        password: NewBycritPassword,
      });

      if (!Changepass) {
        return res.status(500).json({ message: "Something went wrong" });
      }

      return res.status(200).json({ message: "Password changed" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }),
  updateUser: async_handler(async (req, res, next) => {
    try {
      const { firstName, lastName, address } = req.body;

      if (!firstName || !lastName || !address) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const token = jwt.decode(req.cookies.token);
      if (!token?.Userinfo) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const update = await DB.findByIdAndUpdate(token.Userinfo, {
        firstName,
        lastName,
        address: address,
      });
      if (!update) {
        return res.status(500).json({ message: "Something was wrong" });
      }

      return res.status(200).json({ message: "Your information was updated" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }),
  refrech: async_handler(async (req, res, next) => {
    try {
      const cookie = req.cookies;
      if (!cookie?.token)
        return res.status(401).json({ message: "Unauthorized" });
      jwt.verify(
        cookie.token,
        env.parsed.ACCESS_TOKEN_SECRET,
        async (err, decodded) => {
          if (err)
            return res
              .status(403)
              .json({ message: "Forbidden", error: err.message });
          const user = await DB.findById(decodded.Userinfo);
          if (user) {
            const token = jwt.sign(
              { userInfo: user._id },
              env.parsed.ACCESS_TOKEN_SECRET,
              { expiresIn: "24h" }
            );
            return res.status(201).json({ token });
          }
        }
      );
    } catch (error) {
      return res.status(500).json({ error });
    }
  }),
  logout: async_handler(async (req, res, next) => {
    try {
      const cookie = req.cookies;
      if (!cookie?.token)
        return res.status(401).json({ message: "Unauthorized" });
      res.clearCookie("token", {});
      res.status(200).json({ message: "Logout sucssufully" });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }),
};

module.exports = Usercontroler;
