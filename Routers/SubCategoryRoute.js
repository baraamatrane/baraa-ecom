const express = require("express");
const Route = express.Router({ mergeParams: true });
const validator = require("../validation/valadation");
const SubCategorycontroller = require("../Controlers/SubcategoryController");
const { createMulter } = require("../validation/Multer");
const expressAsyncHandler = require("express-async-handler");
const Middleware = require("../Midlwares/Autorize");
const { multer, imageResizer, cleanupUploadedImages } =
  createMulter("Subcategory");
const upload = multer.fields([{ name: "image", maxCount: 1 }]);
Route.use("/Images", express.static("Images/Subcategory"), (req, res, next) => {
  return res.status(404).json({ message: "Image not Found" });
});

Route.get("/Get", SubCategorycontroller.Get)
  .get(
    "/:id",
    validator.Id,
    validator.Middleware,
    SubCategorycontroller.GetSpesific
  )
  .use((req, res, next) => {
    Middleware.Admin(req, res, next);
  })
  .post(
    "/Add",
    // validator.AddSubCategory,
    // validator.Middleware,
    upload,
    expressAsyncHandler(async (req, res, next) => {
      if (req.files) {
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
    SubCategorycontroller.Add
  )
  .delete(
    "/:id",
    validator.IdSubcategory,
    validator.Middleware,
    SubCategorycontroller.Delete
  )
  .put(
    "/:id",
    validator.IdSubcategory,
    // validator.AddCategory,
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
    SubCategorycontroller.Update
  );

module.exports = Route;
