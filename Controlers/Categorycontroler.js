const Category = require("../Schemas/Categoryschema");
const async_handler = require("express-async-handler");
const Subcategory = require("../Schemas/Subcategories");
const cleanupUploadedImages = require("../validation/Multer").createMulter(
  "Category"
).cleanupUploadedImages;
const Categorycontroller = {
  GetCategory: async_handler(async (req, res) => {
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit || 5;
    const skip = (page - 1) * limit;
    const FindCategory = await Category.find({}).skip(skip).limit(limit);
    return res
      .status(200)
      .json({ page, result: FindCategory.length, FindCategory });
  }),
  Getspesific: async_handler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Subcategory id is required" });
    }

    const FindCategory = await Category.findById(id);
    if (!FindCategory) {
      return res.status(404).json({ message: "there is no data " });
    }
    return res.status(200).json({ FindCategory });
  }),
  Add: async_handler(async (req, res) => {
    console.log("enter");
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ message: "name is required" });
      }
      if (!req?.image) {
        return res.status(400).json({ message: "There is no image" });
      }
      const image = req.image.map((pic) => {
        return pic.resizedPath;
      });
      const FindCategory = await Category.findOne({ name });
      if (FindCategory) {
        return res.status(400).json({ message: "Category Allready existe" });
      }
      const CreateCategory = await Category.create({
        name: name,
        image: image[0],
      });
      if (!CreateCategory) {
        res.status(400).json({ message: "An error occurred" });
      }
      return res.status(200).json({ CreateCategory });
    } catch (error) {
      return res.status(500).json({ error });
    }
  }),
  Delete: async_handler(async (req, res) => {
    try {
      const { id } = req.params;
      console.log(id);
      if (!id) {
        return res.status(400).json({ message: "Category id is required" });
      }
      const FindCategory = await Category.findByIdAndDelete(id);
      if (!FindCategory) {
        return res.status(400).json({ message: "Category not found" });
      }
      console.log(FindCategory);
      cleanupUploadedImages(req.images);
      return res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
      return res.status(500).json(error);
    }
  }),
  Update: async_handler(async (req, res) => {
    console.log("enter");
    try {
      const { id } = req.params;
      const data = req.body;
      console.log(req.body);
      if (!data?.name) {
        return res.status(400).json({ message: "You have any data " });
      }
      if (!id) {
        return res.status(400).json({ message: "Category id is required" });
      }
      if (!req?.image || !Array.isArray(req.image) || req.image.length === 0) {
        return res.status(400).json({ message: "There is no image" });
      }
      const image = req.image.map((pic) => {
        return pic.resizedPath;
      });
      console.log(image);
      const UpdateCategory = await Category.findByIdAndUpdate(id, {
        name: data.name,
        image: image[0],
      });
      if (!UpdateCategory) {
        return res.status(400).json({ message: "Category Not found" });
      }
      console.log("req.images :: ", req.images);
      await cleanupUploadedImages(req.images);
      return res.status(200).json({ message: "Category updated successfully" });
    } catch (error) {
      res.status(400).json({ error });
    }
  }),
};

module.exports = Categorycontroller;
