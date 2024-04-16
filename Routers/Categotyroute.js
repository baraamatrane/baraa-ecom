const express = require("express");
const Route = express.Router();
const path = require("path");
const expressAsyncHandler = require("express-async-handler");
const validator = require("../validation/valadation");
const Categorycontroller = require("../Controlers/Categorycontroler");
const SubCategory = require("../Controlers/SubcategoryController");
const { createMulter } = require("../validation/Multer");
const { multer, imageResizer, cleanupUploadedImages } =
  createMulter("Category");
const upload = multer.fields([{ name: "image", maxCount: 1 }]);
// Define a URL path prefix for static files
Route.use("/Images", express.static("Images/Category"), (req, res, next) => {
  return res.status(404).json({ message: "Image not Found" });
});
Route.use(
  "/Images",
  express.static(path.join(__dirname, "../Images/Category"))
);
Route.use((req, res, next) => {
  // Save the original send method
  const originalSend = res.send;

  // Override the send method
  res.send = async function (body) {
    // Call the original send method
    originalSend.apply(res, arguments);

    // Check if the status code is between 400 and 500
    if (res.statusCode >= 400 && res.statusCode <= 500) {
      if (req.image) {
        await cleanupUploadedImages(req.image);
      }
      console.log("Deleted from Middleware");
      // You can perform additional actions here if needed
    }
  };

  // Continue to the next middleware or route handler
  next();
});
Route.use(
  "/AddSubcategories",
  validator.AddCategory,
  validator.Middleware,
  SubCategory.Add
);
Route.use(
  "/:id/Subcategories",
  validator.Id,
  validator.Middleware,
  SubCategory.Get
);
Route.get("/Get", Categorycontroller.GetCategory);
Route.get(
  "/:id",
  validator.Id,
  validator.Middleware,
  Categorycontroller.Getspesific
);
Route.use((req, res, next) => {
  Middleware.Admin(req, res, next);
});
Route.post(
  "/Add",
  // validator.AddCategory,
  // validator.Middleware,
  upload,
  expressAsyncHandler(async (req, res, next) => {
    if (req.files && req.files["image"]) {
      await imageResizer(req, res, (err) => {
        if (err) {
          // Handle image processing error
          return res
            .status(400)
            .json({ message: "Error processing images: " + err.message });
        }
      });
    } else {
      res.status(400).json({ message: "image is required!" });
    }
    // Proceed to the next middleware (ProductController.Add) if no error
    next();
  }),
  Categorycontroller.Add
);

Route.delete(
  "/:id",
  validator.IdCategory,
  validator.Middleware,
  Categorycontroller.Delete
);
Route.put(
  "/:id",
  // validator.AddCategory,
  validator.IdCategory,
  // validator.Middleware,
  upload,
  expressAsyncHandler(async (req, res, next) => {
    if (req.files["image"]) {
      await imageResizer(req, res, (err) => {
        if (err) {
          // Handle image processing error
          return res
            .status(400)
            .json({ message: "Error processing images: " + err.message });
        }
      });
    } else {
      res.status(400).json({ message: "image is required!" });
    }
    // Proceed to the next middleware (ProductController.Add) if no error
    next();
  }),
  Categorycontroller.Update
);

module.exports = Route;
