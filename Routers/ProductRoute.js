const express = require("express");
const Route = express.Router();
const validator = require("../validation/valadation");
const ProductController = require("../Controlers/Productcontroler");
const ReviewController = require("../Controlers/ReviewControlers");
const { createMulter } = require("../validation/Multer");
const { multer, imageResizer, cleanupUploadedImages } = createMulter("Product");
const expressAsyncHandler = require("express-async-handler");
const Middleware = require("../Midlwares/Autorize");
const upload = multer.fields([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 5 },
]);
Route.use("/Images", express.static("Images/Product"), (req, res, next) => {
  return res.status(404).json({ message: "Image not Found" });
});
Route.use((req, res, next) => {
  if (req.image || req.images) {
    // Save the original send method
    const originalSend = res.send;

    // Override the send method
    res.send = async function (body) {
      // Call the original send method
      originalSend.apply(res, arguments);

      // Check if the status code is between 400 and 500
      if (res.statusCode >= 400 && res.statusCode <= 500) {
        // You can perform additional actions here if needed
      }
    };

    // Continue to the next middleware or route handler
  }

  next();
});
// Use the middleware
Route.use((req, res, next) => {
  res.on("finish", async () => {
    const statusCode = res.statusCode;
    if (req.image || req.images) {
      if (statusCode >= 400 && statusCode < 500) {
        console.log("Deleted from Middleware");
        return await cleanupUploadedImages(req.image);
      }
    }
  });
  next();
});

Route.use(
  "/:id/Reviews",
  validator.IdProduct,
  validator.Middleware,
  ReviewController.GetReview
);

Route.get(
  "/Get",
  validator.Product,
  validator.Middleware,
  ProductController.GetProduct
);
Route.get(
  "/:id",
  validator.Id,
  validator.Middleware,
  ProductController.Getspesific
);
Route.get(
  "/Category/:id",
  validator.IdCategory,
  validator.Middleware,
  ProductController.Getcategory
);
Route.use((req, res, next) => {
  Middleware.Admin(req, res, next);
});
Route.post(
  "/Add",
  // validator.AddProduct,
  validator.Middleware,
  upload,
  expressAsyncHandler(async (req, res, next) => {
    console.log(req.files);
    if (req.files["images"] || req.files["imageCover"]) {
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
  expressAsyncHandler(ProductController.Add)
);

Route.delete(
  "/:id",
  validator.IdProduct,
  validator.Middleware,
  ProductController.Delete
);
Route.put(
  "/:id",
  validator.AddProduct,
  validator.IdProduct,
  validator.Middleware,
  upload,
  expressAsyncHandler(async (req, res, next) => {
    if (req.files["images"] || req.files["imageCover"]) {
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
  ProductController.Update
);

module.exports = Route;
