const express = require("express");
const Route = express.Router();
const validator = require("../validation/valadation");
const path = require("path");
const Brandcontroller = require("../Controlers/BrandControlers.js");
const { createMulter } = require("../validation/Multer");
const expressAsyncHandler = require("express-async-handler");
const Middleware = require("../Midlwares/Autorize.js");
const { multer, imageResizer, cleanupUploadedImages } = createMulter("Brand");
const upload = multer.fields([{ name: "image", maxCount: 1 }]);
Route.use("/Images", express.static("Images/Brand"), (req, res, next) => {
  return res.status(404).json({ message: "Image not found" });
});
Route.use((req, res, next) => {
  // Save the original send method
  if (req.image || req.images) {
    const originalSend = res.send;

    // Override the send method
    res.send = async function (body) {
      // Call the original send method
      originalSend.apply(res, arguments);

      // Check if the status code is between 400 and 500
      if (res.statusCode >= 400 && res.statusCode <= 500) {
        await cleanupUploadedImages(req.image);
        console.log("Deleted from Middleware");
        // You can perform additional actions here if needed
      }
    };
  }
  // Continue to the next middleware or route handler
  next();
});
Route.get("/Get", Brandcontroller.GetBrand);
Route.get(
  "/:id",
  validator.IdBrand,
  validator.Middleware,
  Brandcontroller.Getspesific
);
Route.use((req, res, next) => {
  Middleware.Admin(req, res, next);
});
Route.post(
  "/Add",
  validator.AddBrand,
  validator.Middleware,
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
  Brandcontroller.Add
);
Route.delete(
  "/:id",
  validator.IdBrand,
  validator.Middleware,
  Brandcontroller.Delete
);
Route.put(
  "/:id",
  validator.UpdateBrand,
  validator.IdBrand,
  validator.Middleware,
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
  Brandcontroller.Update
);

module.exports = Route;
