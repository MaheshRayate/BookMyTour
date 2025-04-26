const mongoose = require("mongoose");
const Review = require("./../models/reviewModel");
const catchAsync = require("./../utils/catchAsync");

const factory = require("./handlerFactory");

// This function is for setting the user and tour ids in the review when a new review is created
exports.setTourUserIds = catchAsync(async (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId; //These tourId we'll get form the url's params
  if (!req.body.user) req.body.user = req.user.id; //The req.user comes from the protect middleware

  next();
});

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
