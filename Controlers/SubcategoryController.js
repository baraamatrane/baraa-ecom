const Subcategory = require("../Schemas/Subcategories");
const Category = require("../Schemas/Categoryschema");
const async_handler = require("express-async-handler");
const cleanupUploadedImages = require("../validation/Multer").createMulter(
  "Subcategory"
).cleanupUploadedImages;
const Controlers = {
  Get: async_handler(async (req, res) => {
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit || 5;
    const skip = (page - 1) * 1;

    if (req.params.id) {
      // If category ID is provided, filter subcategories for that category
      const Find = await Subcategory.find({ category: req.params.id })
        .skip(skip)
        .limit(limit)
        .populate({ path: "category", select: "name -_id" });

      return res.status(200).json({ page, result: Find.length, data: Find });
    }
    const Find = await Subcategory.find({})
      .skip(skip)
      .limit(limit)
      .populate({ path: "category", select: "name -_id" });

    return res.status(200).json({ page, result: Find.length, data: Find });
  }),
  GetSpesific: async_handler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
      await cleanupUploadedImages(req.image);
      return res.status(400).json({ message: "Subcategory id is required" });
    }
    const Find = await Subcategory.findById(id);
    return res.status(200).json({ data: Find });
  }),
  Add: async_handler(async (req, res, next) => {
    try {
      const { name, category } = req.body;

      const FindCategory = await Category.findById(category);
      if (!FindCategory) {
        await cleanupUploadedImages(req.image);

        return res.status(400).json({ message: "Category not exist" });
      }

      const FindSubCategory = await Subcategory.findOne({ name });
      if (FindSubCategory) {
        await cleanupUploadedImages(req.image);
        return res.status(400).json({ message: "Subcategory already exists" });
      }
      const image = req.image.map((pic) => {
        return pic.resizedPath;
      });
      const CreateSubcategory = await Subcategory.create({
        name,
        category,
        image: image[0],
      });

      return res.status(200).json({ CreateSubcategory });
    } catch (error) {
      await cleanupUploadedImages(req.image);
      next(error);
    }
  }),
  Delete: async_handler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Subcategory id is required" });
    }
    const FindSubcategory = await Subcategory.findByIdAndRemove(id);
    if (!FindSubcategory) {
      await cleanupUploadedImages(req.image);
      return res.status(400).json({ message: "Subcategory not found" });
    }
    await cleanupUploadedImages(req.images);
    return res
      .status(200)
      .json({ message: "Subcategory deleted successfully" });
  }),
  Update: async_handler(async (req, res) => {
    try {
      const { id } = req.params;
      const { name, category } = req.body;
      if (!name || !category) {
        await cleanupUploadedImages(req.image);
        return res.status(400).json({ message: "You have any data " });
      }
      if (!id) {
        await cleanupUploadedImages(req.image);
        return res.status(400).json({ message: "Subcategory id is required" });
      }
      const image = req.image.map((pic) => {
        return pic.resizedPath;
      });
      const UpdateSubcategory = await Subcategory.findByIdAndUpdate(id, {
        name,
        category,
        image: image[0],
      });
      if (!UpdateSubcategory) {
        await cleanupUploadedImages(req.image);
        return res.status(400).json({ message: "Subcategory Not found" });
      }
      await cleanupUploadedImages(req.images);

      return res
        .status(200)
        .json({ message: "Subcategory updated successfully" });
    } catch (error) {
      await cleanupUploadedImages(req.image);
      next(error);
    }
  }),
};

module.exports = Controlers;
