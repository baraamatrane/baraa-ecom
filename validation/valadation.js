const { body, param, query, validationResult } = require("express-validator");
const User = require("../Schemas/Userschema");
const Category = require("../Schemas/Categoryschema.js");
const Product = require("../Schemas/Productschema.js");
const mongoose = require("mongoose");
const Order = require("../Schemas/Ordreschema.js");
const Cart = require("../Schemas/CartItemSchema.js");
const Subcategories = require("../Schemas/Subcategories.js");
const Brand = require("../Schemas/BrandSchema.js");
const jwt = require("jsonwebtoken");
const Review = require("../Schemas/ReviewsSchema.js");
const Validation = {
  Middleware: (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    return next();
  },
  FindOrder: [
    param("id")
      .isMongoId()
      .withMessage("The id is not a valid MongoDB ID")
      .custom(async (value) => {
        const FindCartItem = await Order.findById(value);
        if (!FindCartItem) {
          return Promise.reject("the Order not found!");
        }
      }),
  ],
  DeleteCartItem: [
    param("id")
      .isMongoId()
      .withMessage("The id is not a valid MongoDB ID")
      .custom(async (value, { req }) => {
        const FindCartItem = await Order.findOne({
          "cartItems._id": value,
        });
        if (!FindCartItem) {
          return Promise.reject("the Item not found in Cart");
        }
        console.log(FindCartItem);
        const specificCartItem = FindCartItem.cartItems.find(
          (item) => item._id.toString() === value
        );
        console.log(specificCartItem, ".....");
        req.Product = specificCartItem;
      }),
  ],

  UpdateCartItem: [
    param("id")
      .isMongoId()
      .withMessage("The id is not a valid MongoDB ID")
      .custom(async (value, { req }) => {
        const user = new mongoose.Types.ObjectId(
          req.user?._id || req?.guest_id || req.cookies?.guest_id
        );
        const FindCartItem = await Cart.findOne({
          $or: [{ user: user }, { _id: user }],
        });
        console.log(FindCartItem);
        if (!FindCartItem) {
          return Promise.reject("An error was occured !");
        }
        const Cartitem = FindCartItem.cartItems.filter((item) =>
          item._id.equals(new mongoose.Types.ObjectId(value))
        );
        if (Cartitem.length !== 1) {
          return Promise.reject("CartItem not found");
        }
        console.log("Cartitem : ....", Cartitem);
        req.Product = Cartitem[0];
      }),
  ],
  GetCart: [
    param("id")
      .isMongoId()
      .withMessage("The id is not a valid MongoDB ID")
      .custom(async (value, { req }) => {
        const FindCartItem = await Cart.findOne({
          user: new mongoose.Types.ObjectId(
            req.user?._id || req?.guest_id || req.cookies?.guest_id
          ),
        });
        if (!FindCartItem) {
          return Promise.reject("Cart not found");
        }
        req.Cart = FindCartItem;
      }),
  ],
  AddCartItem: [
    body("color")
      .notEmpty()
      .withMessage("Color is required")
      .isString()
      .withMessage("color must be string"),
    body("product")
      .isMongoId()
      .withMessage("The id is not a valid MongoDB ID")
      .custom(async (value, { req }) => {
        const FindProduct = await Product.findById(value);
        if (!FindProduct) {
          return Promise.reject("Product not found");
        }
        console.log("final");
        req.Product = FindProduct;
      }),
  ],
  AddProduct: [
    // body("imageCover")
    //   .notEmpty()
    //   .withMessage("you must add image Cover ")
    //   .custom((value, { req }) => {
    //     console.log(value, req.body);
    //   }),
    // body("images")
    //   .notEmpty()
    //   .withMessage("you must add images ")
    //   .isArray({ min: 1, max: 7 })
    //   .withMessage("Images must be between 1 and 7")
    //   .custom((value, { req }) => {
    //     console.log(value, req.body);
    //   }),
    body("title")
      .notEmpty()
      .withMessage("Title is required")
      .isLength({ max: 40 })
      .withMessage("Title cannot exceed 40 characters"),
    body("description")
      .notEmpty()
      .withMessage("Description is required")
      .isLength({ max: 255 })
      .withMessage("Title cannot exceed 255 characters"),
    body("quantity")
      .notEmpty()
      .withMessage("Quantity is required")
      .isInt({ min: 0 })
      .withMessage("Quantity must be a non-negative integer"),
    body("sold")
      .notEmpty()
      .withMessage("Sold is required")
      .isInt({ min: 0 })
      .withMessage("Sold must be a non-negative integer"),
    body("price")
      .notEmpty()
      .withMessage("Price is required")
      .isNumeric()
      .withMessage("Price must be a number")
      .isFloat({ min: 0 })
      .withMessage("Price must be a non-negative float"),
    body("priceAfterDiscount")
      .notEmpty()
      .withMessage("Price After Discount is required")
      .isNumeric()
      .withMessage("Price After Discount must be a number")
      .isFloat({ min: 0 })
      .withMessage("Price After Discount must be a non-negative float"),
    body("colors")
      .notEmpty()
      .withMessage("Colors are required")
      .isArray({ min: 1 })
      .withMessage("Colors must be an array with at least one element"),
    body("category")
      .notEmpty()
      .withMessage("Category is required")
      .isMongoId()
      .withMessage("The id is not a valid MongoDB ID")
      .custom(async (value) => {
        const category = await Category.findById(value);
        if (!category) {
          return Promise.reject("Category Not Found");
        }
      }),
    body("subcategories")
      .notEmpty()
      .withMessage("subcategories are required")
      .isArray({ min: 1 })
      .withMessage("subcategories must be an array with at least one element")
      .isMongoId()
      .withMessage("The id is not a valid MongoDB ID")
      .custom(async (value) => {
        const SubCategory = await Subcategories.find({
          _id: { $exists: true, $in: value },
        });
        if (!SubCategory || SubCategory.length !== value.length) {
          return Promise.reject(`Subcategories Not Found ${value}`);
        }
      })
      .custom(async (value, { req }) => {
        const subcategoriesInCategory = await Subcategories.find({
          category: req.body.category,
        });

        const containsIds = subcategoriesInCategory.filter((item) =>
          value.includes(item._id.toString())
        );
        if (!containsIds || containsIds.length !== value.length) {
          return Promise.reject(
            "Subcategories do not belong to the specified category"
          );
        }
      }),
    body("brand")
      .notEmpty()
      .withMessage("Brand is required")
      .isMongoId()
      .withMessage("The id is not a valid MongoDB ID")
      .custom(async (value) => {
        const FindBrand = await Brand.findById(value);
        if (!FindBrand) {
          return Promise.reject("Brand Not Found");
        }
      }),
    body("ratingsAverage")
      .notEmpty()
      .withMessage("Ratings Average is required")
      .isNumeric()
      .withMessage("Ratings Average must be a number")
      .isFloat({ min: 0, max: 5 })
      .withMessage("Ratings Average must be between 0 and 5"),
    body("rantingsQuantity")
      .notEmpty()
      .withMessage("Ratings Quantity is required")
      .isInt({ min: 0 })
      .withMessage("Ratings Quantity must be a non-negative integer"),
  ],
  AddWishlist: [
    param("id")
      .isMongoId()
      .withMessage("The id is not a valid MongoDB ID")
      .custom(async (value, { req }) => {
        const id = await jwt.decode(req.cookies.token).Userinfo;
        const Finduser = await User.findById(id);
        if (!Finduser) {
          return Promise.reject("User Not Found");
        }
        const FindWishlist = await User.findById(id);
        if (req.originalUrl === `/User/${value}/AddWishlist`) {
          if (FindWishlist.wishlist.includes(value)) {
            return Promise.reject(
              "You have Allready this Product in your Wishlist"
            );
          }
        }
      }),
  ],
  Product: [
    query(["sold", "price", "RantingSort"])
      .optional()
      .isIn(["1", "-1"])
      .withMessage("Sort order must be either 1 or -1"),
    query(["max_price", "min_price"])
      .optional()
      .isNumeric()
      .withMessage("Price must be a number")
      .isFloat({ min: 0 })
      .withMessage("Price must be a non-negative float"),
    query("category")
      .optional()
      .isMongoId()
      .withMessage("The id is not a valid MongoDB ID")
      .custom(async (value) => {
        const category = await Category.findById(value);
        if (!category) {
          return Promise.reject("Category Not Found");
        }
      }),
    query("subcategories")
      .optional()
      .isMongoId()
      .withMessage("The id is not a valid MongoDB ID")
      .custom(async (value) => {
        const SubCategory = await Subcategories.findById(value);
        console.log(SubCategory);
        if (!SubCategory) {
          return Promise.reject(`Subcategories Not Found ${value}`);
        }
      }),
  ],
  AddCategory: [
    body("name")
      .notEmpty()
      .withMessage("is required")
      .custom(async (value) => {
        const FindCategory = await Category.find({ name: value });
        if (!FindCategory) {
          return Promise.reject("Category is Already exist");
        }
      })
      .isLength({ min: 3, max: 20 })
      .withMessage("Category length should be between 3 and 20 characters"),
    body("image").notEmpty().withMessage("image required"),
  ],
  CheckAddress: [
    body("address.phone")
      .notEmpty()
      .withMessage("Phone is required")
      .isNumeric()
      .withMessage("phone is numbre")
      .isMobilePhone("ar-MA")
      .withMessage("your phone is not a Morroccan Mobilephone"),
    body("address.address")
      .notEmpty()
      .withMessage("is required")
      .isLength({ min: 5, max: 80 })
      .withMessage("Street length should be between 3 and 20 characters"),
    body("address.city")
      .notEmpty()
      .withMessage("is required")
      .isLength({ min: 3, max: 20 })
      .withMessage("City length should be between 3 and 20 characters"),
  ],
  AddBrand: [
    body("name")
      .notEmpty()
      .withMessage("Brand is required")
      .isLength({ min: 3, max: 20 })
      .withMessage("Brand length should be between 3 and 20 characters")
      .custom(async (value) => {
        const FindBrand = await Brand.find({ name: value });
        if (!FindBrand) {
          return Promise.reject({ message: "Brand is Already exist" });
        }
      }),
  ],
  AddReview: [
    body("title")
      .notEmpty()
      .withMessage("Review is required")
      .isLength({ min: 3, max: 40 })
      .withMessage("Review length should be between 3 and 40 characters"),
    body("ratings")
      .notEmpty()
      .withMessage("Ratings is required")
      .isNumeric()
      .withMessage("Ratings must be a number")
      .isFloat({ min: 1, max: 5 })
      .withMessage("Ratings must be between 0 and 5"),
    body("Product")
      .notEmpty()
      .withMessage("Product is required")
      .isMongoId()
      .withMessage("The id is not a valid MongoDB ID")
      .custom(async (value) => {
        const findProductrReviews = await Product.findById(value);
        if (!findProductrReviews) {
          return Promise.reject("Product not found");
        }

        return Promise.resolve();
      }),
  ],
  UpdateBrand: [
    body("name")
      .notEmpty()
      .withMessage("Brand is required")
      .isLength({ min: 3, max: 20 })
      .withMessage("Brand length should be between 3 and 20 characters")
      .custom(async (value) => {
        const FindBrand = await Brand.find({ name: value });
        if (!FindBrand) {
          return Promise.reject("Brand is Not Found");
        }
      }),
  ],
  AddSubCategory: [
    body("name")
      .notEmpty()
      .withMessage("is required")
      .isLength({ min: 3, max: 20 })
      .withMessage("Category length should be between 3 and 20 characters"),
    body("category")
      .notEmpty()
      .withMessage("is required")
      .isMongoId()
      .withMessage("the category is not a MongoDB ID")
      .custom(async (value) => {
        const category = await Category.findById(value);
        if (!category) {
          return Promise.reject("Category Not Found");
        }
      }),
  ],
  IdCategory: [
    param("id")
      .isMongoId()
      .withMessage("The id is not a valid MongoDB ID")
      .custom(async (value, { req }) => {
        const FindCategory = await Category.findById(value);
        if (!FindCategory) {
          return Promise.reject("Category Not Found");
        }
        req.images = [{ resizedPath: FindCategory.image }];
      }),
  ],
  IdOrder: [
    param("id")
      .isMongoId()
      .withMessage("The id is not a valid MongoDB ID")
      .custom(async (value, { req }) => {
        const FindOrder = await Order.findById(value);
        if (!FindOrder) {
          return Promise.reject("Order Not Found");
        }
        req.IdOrder = FindOrder;
      }),
  ],
  Id: [param("id").isMongoId().withMessage("The id is not a valid MongoDB ID")],
  IdBrand: [
    param("id")
      .isMongoId()
      .withMessage("The id is not a valid MongoDB ID")
      .custom(async (value, { req }) => {
        const FindBrand = await Brand.findById(value);

        if (!FindBrand) {
          return Promise.reject("Brand Not Found");
        }

        req.images = [{ resizedPath: FindBrand.image }];
      }),
  ],

  IdReview: [
    param("id")
      .isMongoId()
      .withMessage("The id is not a valid MongoDB ID")
      .custom(async (value) => {
        const FindProduct = await Product.findById(value);
        if (!FindProduct) {
          return Promise.reject("Product Not Found");
        }
      }),
  ],
  IdSubcategory: [
    param("id")
      .isMongoId()
      .withMessage("The id is not a valid MongoDB ID")
      .custom(async (value, { req }) => {
        const FindSubcategory = await Subcategories.findById(value);

        if (!FindSubcategory) {
          return Promise.reject("Subcategory Not Found");
        }

        req.images = [{ resizedPath: FindSubcategory.image }];
      }),
  ],
  IdProduct: [
    param("id")
      .isMongoId()
      .withMessage("The id is not a valid MongoDB ID")
      .custom(async (value, { req }) => {
        const FindProduct = await Product.findById(value);
        if (!FindProduct) {
          return Promise.reject("Product Not Found");
        }
        if (
          req.originalUrl === "/Product/Add" ||
          req.originalUrl === `/Product/${req.params.Id}`
        ) {
          const AllImages = [].concat(FindProduct.images).map((image) => {
            return { resizedPath: image };
          });
          req.images = [{ resizedPath: FindProduct.imageCover }, ...AllImages];
          console.log(req.images);
        }
      }),
  ],
  userRegister: [
    body("firstName")
      .notEmpty()
      .withMessage("is required")
      .isLength({ min: 3, max: 20 })
      .withMessage("First name length should be between 3 and 20 characters"),
    body("lastName")
      .notEmpty()
      .withMessage("is required")
      .isLength({ min: 3, max: 20 })
      .withMessage("Last name length should be between 3 and 20 characters"),
    body("password")
      .notEmpty()
      .withMessage("is required")
      .isStrongPassword()
      .withMessage("Your password must be strong")
      .isLength({ min: 8, max: 32 })
      .withMessage("Password length should be between 8 and 32 characters"),
    body("email")
      .notEmpty()
      .withMessage("is required")
      .isEmail()
      .withMessage("This email is not a valid email address")
      .isLength({ min: 20, max: 40 })
      .withMessage("Email length should be between 20 and 40 characters")
      .custom(async (value) => {
        const user = await User.findOne({ email: value });
        if (user) {
          return Promise.reject("E-mail already in use");
        }
      }),
    // body("address.phone")
    //   .notEmpty()
    //   .withMessage("Phone is required")
    //   .isNumeric()
    //   .withMessage("phone is numbre")
    //   .isMobilePhone("ar-MA")
    //   .withMessage("your phone is not a Morroccan Mobilephone"),
    // body("address.street")
    //   .notEmpty()
    //   .withMessage("is required")
    //   .isLength({ min: 3, max: 20 })
    //   .withMessage("Street length should be between 3 and 20 characters"),
    // body("address.city")
    //   .notEmpty()
    //   .withMessage("is required")
    //   .isLength({ min: 3, max: 20 })
    //   .withMessage("City length should be between 3 and 20 characters"),
    // body("address.state")
    //   .notEmpty()
    //   .withMessage("is required")
    //   .isLength({ min: 2, max: 20 })
    //   .withMessage("State length should be between 2 and 20 characters"),
    // body("address.zip")
    //   .notEmpty()
    //   .withMessage("is required")
    //   .isPostalCode("any")
    //   .withMessage("ZIP code must be a valid postal code")
    //   .isLength({ min: 3, max: 7 })
    //   .withMessage("ZIP length should be between 3 and 7 characters"),
  ],
  userUpdate: [
    body("firstName")
      .notEmpty()
      .withMessage("is required")
      .isLength({ min: 3, max: 20 })
      .withMessage("First name length should be between 3 and 20 characters"),
    body("lastName")
      .notEmpty()
      .withMessage("is required")
      .isLength({ min: 3, max: 20 })
      .withMessage("Last name length should be between 3 and 20 characters"),
    body("address.phone")
      .notEmpty()
      .withMessage("Phone is required")
      .isNumeric()
      .withMessage("phone is numbre")
      .isMobilePhone("ar-MA")
      .withMessage("your phone is not a Morroccan Mobilephone"),
    body("address.address")
      .notEmpty()
      .withMessage("is required")
      .isLength({ min: 5, max: 80 })
      .withMessage("Street length should be between 3 and 20 characters"),
    body("address.city")
      .notEmpty()
      .withMessage("is required")
      .isLength({ min: 3, max: 20 })
      .withMessage("City length should be between 3 and 20 characters"),
  ],
  userLogin: [
    body("password")
      .notEmpty()
      .withMessage("is required")
      .isStrongPassword()
      .withMessage("Your password must be strong"),
    body("email")
      .notEmpty()
      .withMessage("is required")
      .isEmail()
      .withMessage("This email is not a valid email address")
      .custom(async (value) => {
        const user = await User.find({ email: value });
        if (!user) {
          return Promise.reject("E-mail not existe");
        }
      }),
  ],
  userChangePassword: [
    body("password")
      .notEmpty()
      .withMessage("is required")
      .isStrongPassword()
      .withMessage("Your password must be strong")
      .isLength({ min: 8, max: 32 })
      .withMessage("Password length should be between 8 and 32 characters"),
    body("newpassword")
      .notEmpty()
      .withMessage("is required")
      .isStrongPassword()
      .withMessage("Your password must be strong")
      .isLength({ min: 8, max: 32 })
      .withMessage("Password length should be between 8 and 32 characters"),
    body("confirmpassword")
      .notEmpty()
      .withMessage("is required")
      .isLength({ min: 8, max: 32 })
      .withMessage("Password length should be between 8 and 32 characters"),
  ],
};

module.exports = Validation;
