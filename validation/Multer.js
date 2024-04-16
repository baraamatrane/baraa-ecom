const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const slugify = require("slugify");
const expressAsyncHandler = require("express-async-handler");
const createMulter = (folder) => {
  const storage = multer.memoryStorage();

  const fileFilter = (req, file, cb) => {
    console.log("fileFilter : ", file);
    if (!file) {
      cb(new Error("There is no image uploading!"), false);
    }
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images are allowed."), false);
    }
  };

  const imageResizer = expressAsyncHandler(async (req, res, next) => {
    console.log("req.files .......  ::::::::", req.files);
    try {
      if (req.files) {
        const imageCoverFiles = req.files["imageCover"] || [];
        const imagesFiles = req.files["images"] || [];
        const CategoryImage = req.files["image"] || [];
        const allFiles = [...imageCoverFiles, ...imagesFiles, ...CategoryImage];
        const images = [];

        // Use map to create an array of promises
        console.log("All Files ................", allFiles);
        const resizePromises = allFiles.map(async (file) => {
          // Check if the file has an original name
          if (file.originalname) {
            console.log(file);
            const imageFileName = `/${folder}-${uuidv4()}-${Date.now()}.jpeg`;
            images.push({
              resizedPath: imageFileName,
              fieldname: file.fieldname,
            });

            // Corrected variable name from With to Width
            const Width = folder === "Product" ? 2000 : 600;
            const Height = folder === "Product" ? 1333 : 600;

            return (
              sharp(file.buffer)
                .resize(Width, Height)
                .toFormat("jpeg")
                .jpeg({ quality: 95 })
                // Corrected the file path by adding a slash before "Images"
                .toFile(`Images/${folder}${imageFileName}`)
                .then(() => {
                  console.log("Image resized successfully:", imageFileName);
                })
            );
          }
        });

        // Wait for all resize promises to complete
        await Promise.all(resizePromises);

        // Set req.image with the array of resized images
        req.image = images;

        console.log("All images resized successfully!");
      }
    } catch (err) {
      console.error("Error resizing images:", err);
      res
        .status(400)
        .json({ message: "Error processing images", error: err.message });
    }

    next(); // Call next() to proceed to the next middleware
  });

  const multerInstance = multer({
    storage,
    fileFilter,
    limits: { fileSize: 1024 * 1024 },
  });
  const cleanupUploadedImages = expressAsyncHandler(async (image) => {
    try {
      console.log("image cleanup :: ", image);
      if (image && Array.isArray(image)) {
        const cleanupPromises = image.map(async (file) => {
          try {
            console.log("Delete ::::", `Images/${folder}${file.resizedPath}`);
            await fs.promises.unlink(`Images/${folder}${file.resizedPath}`);
            console.log(
              "image deleted:",
              `Images/${folder}${file.resizedPath}`
            );
          } catch (deleteError) {
            console.error("Error deleting product image:", deleteError);
          }
        });

        // Use Promise.all to wait for all cleanup operations to complete
        await Promise.all(cleanupPromises);
      }
    } catch (error) {
      console.error("An error occurred during image deletion:", error);
      throw error; // Re-throw the error to propagate it
    }
  });
  return {
    multer: multerInstance,
    imageResizer,
    cleanupUploadedImages,
  };
};

module.exports = { createMulter };
