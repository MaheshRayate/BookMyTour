const Tour = require("../models/tourModel");
const User = require("../models/userModel");

const AppError = require("./../utils/appError");
const catchAsync = require("../utils/catchAsync");
const Booking = require("../models/bookingModel");

exports.getOverview = catchAsync(async (req, res) => {
  // 1. Get the Data (Get all tours)
  const tours = await Tour.find();

  // 2).Build the template

  // 3).Render that template using tour data
  res.status(200).render("overview", {
    title: "All tours",
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1).Get the data for the requested tour(including reviews and guides)
  // guides are all ready populated we need to populate reviews now

  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: "reviews",
    fields: "review rating user",
  });

  if (!tour) {
    return next(new AppError("There is no Tour with that Name", 404));
  }

  // 2).Build template

  // 3)Render template using data from 1
  res.status(200).render("tour", {
    title: `${tour.name}`,
    tour,
  });

  // res.status(200).json({
  //   data: tour,
  // });
});

exports.getLoginForm = (req, res, next) => {
  res.status(200).render("login", {
    title: "Log into your account",
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render("account", {
    title: "Your account",
  });
};

exports.updateUserData = async (req, res) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).render("account", {
    title: "Your account",
    user: updatedUser,
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1)Find all bookings
  const bookings = await Booking.find({ user: req.user.id });

  // 2)Find tours with the returned IDs
  const tourIDs = bookings.map((el) => el.tour);

  const tours = await Tour.find({ _id: { $in: tourIDs } });
  res.status(200).render("overview", {
    title: "My Tours",
    tours,
  });
});
