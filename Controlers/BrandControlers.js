const Brand = require("../Schemas/Brandschema.js");
const async_handler = require("express-async-handler");
const cleanupUploadedImages = require("../validation/Multer").createMulter(
  "Brand"
).cleanupUploadedImages;
const Brandcontroller = {
  GetBrand: async_handler(async (req, res) => {
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit || 5;
    const skip = (page - 1) * limit;
    const FindBrand = await Brand.find({}).skip(skip).limit(limit);
    return res.status(200).json({ page, result: FindBrand.length, FindBrand });
  }),
  Getspesific: async_handler(async (req, res) => {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "Brand id is required" });
    }

    const FindBrand = await Brand.findById(id);
    if (!FindBrand) {
      return res.status(404).json({ message: "there is no data " });
    }
    return res.status(200).json({ FindBrand });
  }),
  Add: async_handler(async (req, res, next) => {
    try {
      const { name } = req.body;

      const FindBrand = await Brand.findOne({ name });
      if (FindBrand) {
        return res.status(400).json({ message: "Brand already exists" });
      }
      console.log(req.image);
      const image = req.image.map((pic) => {
        return pic.resizedPath;
      });
      const CreateBrand = await Brand.create({
        name,
        image: image[0],
      });

      return res.status(200).json({ CreateBrand });
    } catch (error) {
      next(error);
    }
  }),

  Delete: async_handler(async (req, res) => {
    try {
      const { id } = req.params;
      console.log(id);
      if (!id) {
        return res.status(400).json({ message: "Brand id is required" });
      }
      if (!req?.images) {
        res.status(400).json({ message: "There is no image" });
      }
      const FindBrand = await Brand.findByIdAndDelete(id);
      if (!FindBrand) {
        return res.status(400).json({ message: "Brand not found" });
      }
      console.log(FindBrand);
      await cleanupUploadedImages(req.images);
      return res.status(200).json({ message: "Brand deleted successfully" });
    } catch (error) {
      return res.status(500).json(error);
    }
  }),
  Update: async_handler(async (req, res) => {
    try {
      console.log("enter");
      const { id } = req.params;
      const data = req.body;
      if (!data?.name) {
        return res.status(400).json({ message: "You have any data " });
      }
      if (!id) {
        return res.status(400).json({ message: "Brand id is required" });
      }
      const image = req.image.map((pic) => {
        return pic.resizedPath;
      });
      const UpdateBrand = await Brand.findByIdAndUpdate(id, {
        name: data.name,
        image: image[0],
      });
      if (!UpdateBrand) {
        return res.status(400).json({ message: "Brand Not found" });
      }
      await cleanupUploadedImages(req.images);
      return res.status(200).json({ message: "Brand updated successfully" });
    } catch (error) {}
  }),
};

module.exports = Brandcontroller;
