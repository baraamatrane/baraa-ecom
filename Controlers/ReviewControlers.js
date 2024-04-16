const Review = require("../Schemas/ReviewsSchema.js");
const mongoose = require("mongoose");
const ProductSchema = require("../Schemas/Productschema.js");
const async_handler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const Reviewcontroller = {
  GetReview: async_handler(async (req, res) => {
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit || 5;
    const skip = (page - 1) * limit;
    const FindReview = await Review.find({}).skip(skip).limit(limit);
    return res
      .status(200)
      .json({ page, result: FindReview.length, FindReview });
  }),
  Getspesific: async_handler(async (req, res) => {
    const { id } = req.params;
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit || 5;
    const skip = (page - 1) * limit;
    if (!id) {
      return res.status(400).json({ message: "Review id is required" });
    }

    const FindReview = await Review.find({ Product: id })
      .skip(skip)
      .limit(limit);
    if (!FindReview) {
      return res.status(404).json({ message: "there is no data " });
    }
    return res.status(200).json({ FindReview, page });
  }),
  Add: async_handler(async (req, res, next) => {
    try {
      const { title, Product, ratings } = req.body;
      if (!title || !Product || !ratings) {
        res.status(400).json({ message: "All data Is required" });
      }
      const { token } = req;

      if (!token) {
        return res.status(401).json({ message: "Invalid or missing token" });
      }
      const findUserReviews = await Review.find({
        User: token.Userinfo,
      });
      if (findUserReviews.length > 0) {
        return res.status(401).json({ message: "You already have a review" });
      }
      const CreateReview = await Review.create({
        title,
        Product,
        User: token.Userinfo,
        ratings,
      });
      if (!CreateReview) {
        return res.status(400).json({ message: "An error occure!" });
      }
      const FindReview = await Review.find({ Product });
      const TotalRatings = FindReview.reduce(
        (previousValue, currentValue) => previousValue + currentValue.ratings,
        0
      );
      const ratingsAverage = (TotalRatings / FindReview.length).toFixed(2);
      await ProductSchema.findByIdAndUpdate(Product, {
        $set: {
          ratingsAverage,
          ratingsQuantity: FindReview.length,
        },
      });
      return res.status(200).json({ CreateReview });
    } catch (error) {
      next(error);
    }
  }),

  Delete: async_handler(async (req, res) => {
    try {
      const { id } = req.params;
      console.log(id);
      if (!id) {
        return res.status(400).json({ message: "Review id is required" });
      }
      const DeleteReview = await Review.findByIdAndDelete(id);
      if (!DeleteReview) {
        return res.status(400).json({ message: "Review not found" });
      }
      console.log(DeleteReview);
      const Product = String(DeleteReview.Product);
      const FindReview = await Review.find({ Product });
      const TotalRatings = FindReview.reduce(
        (previousValue, currentValue) => previousValue + currentValue.ratings,
        0
      );
      const ratingsAverage = (TotalRatings / FindReview.length).toFixed(2);
      await ProductSchema.findByIdAndUpdate(Product, {
        $set: {
          ratingsAverage,
          ratingsQuantity: FindReview.length,
        },
      });
      return res.status(200).json({ message: "Review deleted successfully" });
    } catch (error) {
      return res.status(500).json(error);
    }
  }),
  Update: async_handler(async (req, res, next) => {
    try {
      console.log("enter");
      const { id } = req.params;
      const { title, Product, User, ratings } = req.body;

      if (!id) {
        return res.status(400).json({ message: "Review id is required" });
      }

      if (!title || !Product || !User || !ratings) {
        return res.status(400).json({ message: "All data Is required" });
      }

      // Use the { new: true } option to get the updated document
      const UpdateReview = await Review.findByIdAndUpdate(
        id,
        {
          title,
          Product,
          User,
          ratings,
        },
        { new: true }
      );

      if (!UpdateReview) {
        return res.status(400).json({ message: "Review Not found" });
      }
      const FindReview = await Review.find({ Product });
      const TotalRatings = FindReview.reduce(
        (previousValue, currentValue) => previousValue + currentValue.ratings,
        0
      );
      const ratingsAverage = (TotalRatings / FindReview.length).toFixed(2);
      await ProductSchema.findByIdAndUpdate(Product, {
        $set: {
          ratingsAverage,
          ratingsQuantity: FindReview.length,
        },
      });
      return res
        .status(200)
        .json({ UpdateReview, message: "Review updated successfully" });
    } catch (error) {
      next(error);
    }
  }),
};

module.exports = Reviewcontroller;
