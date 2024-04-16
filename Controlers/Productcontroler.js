const Product = require("../Schemas/Productschema");
const async_handler = require("express-async-handler");
const cleanupUploadedImages = require("../validation/Multer").createMulter(
  "Product"
).cleanupUploadedImages;
const Productcontroller = {
  GetProduct: async_handler(async (req, res) => {
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit || 5;
    const {
      max_price,
      min_price,
      ratingsAverage,
      category,
      subcategories,
      brand,
      price,
      RantingSort,
      keyword,
      sold,
    } = req.query;

    const skip = (page - 1) * limit;
    const query = {};

    if (max_price) query.price = { $lte: parseFloat(max_price) };
    if (min_price)
      query.price = { ...query.price, $gte: parseFloat(min_price) };
    if (ratingsAverage)
      query.ratingsAverage = { $gte: parseFloat(ratingsAverage) };
    if (category) query.category = category;
    if (subcategories) query.subcategories = { $in: subcategories };
    if (brand) query.brand = brand;
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ];
    }
    const sortQuery = {};
    if (price) {
      sortQuery.price = price;
    }
    if (RantingSort) {
      sortQuery.ratingsAverage = RantingSort;
    }
    if (sold) {
      sortQuery.sold = sold;
    }

    const FindProduct = await Product.find(query)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit);
    return res
      .status(200)
      .json({ page, result: FindProduct.length, FindProduct });
  }),
  Getspesific: async_handler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Product id is required" });
    }

    const FindProduct = await Product.findById(id);
    if (!FindProduct) {
      return res.status(404).json({ message: "there is no data " });
    }
    return res.status(200).json({ FindProduct });
  }),
  Getcategory: async_handler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Product id is required" });
    }

    const FindProduct = await Product.find({ category: id });
    if (!FindProduct) {
      return res.status(404).json({ message: "there is no data " });
    }
    return res.status(200).json({ FindProduct });
  }),
  Add: async_handler(async (req, res) => {
    try {
      // Ensure that req.image is an array and is not empty
      if (!req?.image || !Array.isArray(req.image) || req.image.length === 0) {
        return res.status(400).json({ message: "There is no image" });
      }

      const {
        title,
        description,
        quantity,
        sold,
        price,
        priceAfterDiscount,
        colors,
        category,
        subcategories,
        brand,
        ratingsAverage,
        rantingsQuantity,
      } = req.body;

      // Extract image paths from req.image
      let imageCover = "";
      const images = [];

      req.image.forEach((image) => {
        if (image.fieldname === "imageCover") {
          imageCover = image.resizedPath;
        } else {
          images.push(image.resizedPath);
        }
      });

      if (!title) {
        return res.status(400).json({ message: "Title is required" });
      }

      if (!description) {
        return res.status(400).json({ message: "Description is required" });
      }

      // // Repeat the above for each field...

      // // Check if any of the array fields are empty
      // if (!colors || !Array.isArray(colors) || colors.length === 0) {
      //   return res
      //     .status(400)
      //     .json({ message: "Colors must be a non-empty array" });
      // }

      if (!images || !Array.isArray(images) || images.length === 0) {
        return res
          .status(400)
          .json({ message: "Images must be a non-empty array" });
      }

      // if (
      //   !subcategories ||
      //   !Array.isArray(subcategories) ||
      //   subcategories.length === 0
      // ) {
      //   return res
      //     .status(400)
      //     .json({ message: "subcategories must be a non-empty array" });
      // }

      // // Check if any numeric fields are not valid numbers
      if (isNaN(quantity) || quantity < 0) {
        return res
          .status(400)
          .json({ message: "Quantity must be a non-negative number" });
      }

      if (isNaN(sold) || sold < 0) {
        return res
          .status(400)
          .json({ message: "Sold must be a non-negative number" });
      }

      if (isNaN(price) || price < 0) {
        return res
          .status(400)
          .json({ message: "Price must be a non-negative number" });
      }

      if (isNaN(priceAfterDiscount) || priceAfterDiscount < 0) {
        return res.status(400).json({
          message: "Price After Discount must be a non-negative number",
        });
      }

      if (isNaN(ratingsAverage) || ratingsAverage < 0 || ratingsAverage > 5) {
        return res.status(400).json({
          message: "Ratings Average must be a number between 0 and 5",
        });
      }

      // if (isNaN(rantingsQuantity) || rantingsQuantity < 0) {
      //   return res
      //     .status(400)
      //     .json({ message: "Rantings Quantity must be a non-negative number" });
      // }

      // All validations passed, proceed to create the product
      const CreateProduct = await Product.create({
        title,
        description,
        quantity,
        sold,
        price,
        priceAfterDiscount,
        colors,
        images,
        imageCover,
        category,
        subcategories,
        brand,
        ratingsAverage,
        rantingsQuantity,
      });

      if (!CreateProduct) {
        return res
          .status(500)
          .json({ message: "An error occurred while creating the product" });
      }

      return res.status(201).json({ CreateProduct });
    } catch (error) {
      await cleanupUploadedImages(req.image);
      return res.status(500).json({ error });
    }
  }),

  Delete: async_handler(async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Product id is required" });
      }
      const FindProduct = await Product.findByIdAndDelete(id);
      if (!FindProduct) {
        return res.status(400).json({ message: "Product not found" });
      }
      await cleanupUploadedImages(req.images);
      return res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
      return res.status(500).json(error);
    }
  }),
  Update: async_handler(async (req, res) => {
    console.log(req.files);
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Product id is required" });
      }
      if (!req?.image || !Array.isArray(req.image) || req.image.length === 0) {
        return res.status(400).json({ message: "There is no image" });
      }
      const {
        title,
        description,
        quantity,
        sold,
        price,
        priceAfterDiscount,
        colors,
        category,
        subCategories,
        brand,
        ratingsAverage,
        ratingsQuantity,
      } = req.body;
      if (
        !title ||
        !description ||
        !quantity ||
        !sold ||
        !price ||
        !priceAfterDiscount ||
        !colors ||
        !category ||
        !subCategories ||
        !brand ||
        !ratingsAverage ||
        !ratingsQuantity
      ) {
        return res.status(400).json({ message: "You have any data " });
      }
      let imageCover = "";
      const images = [];

      req.image.forEach((image) => {
        if (image.fieldname === "imageCover") {
          imageCover = image.resizedPath;
        } else {
          images.push(image.resizedPath);
        }
      });
      const UpdateProduct = await Product.findByIdAndUpdate(id, {
        title,
        description,
        quantity,
        sold,
        price,
        priceAfterDiscount,
        colors,
        images,
        imageCover,
        category,
        subCategories,
        brand,
        ratingsAverage,
        ratingsQuantity,
      });
      if (!UpdateProduct) {
        return res.status(400).json({ message: "Product Not found" });
      }
      console.log(req.images);
      await cleanupUploadedImages(req.images);
      return res.status(200).json({ message: "Product updated successfully" });
    } catch (error) {
      res.status(500).json({ error });
    }
  }),
};

module.exports = Productcontroller;
