const express = require("express");
const AppError = require("../utils/appError");
const Booking = require("../models/bookingModel");
const Tour = require("../models/tourModel");
const catchAsync = require("../utils/catchAsync");
const factory = require("./../controllers/handlerFactory");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY); //importing stripe and passing the secret key

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked Tour
  const tour = await Tour.findById(req.params.tourID);
  if (!tour) {
    return next(new AppError("No tour found with that ID", 404));
  }

  // 2)Create the checkout session as per Stripe API
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    success_url: `${req.protocol}://${req.get("host")}/?tour=${
      req.params.tourID
    }&user=${req.user.id}&price=${tour.price}`, //on success redirect to the home page
    cancel_url: `${req.protocol}://${req.get("host")}/tours/${tour.slug}`, //on cancel redirect to the tour page
    customer_email: req.user.email,
    client_reference_id: req.params.tourID,
    //line items are the details of the product(tour) that we want to send
    //its an array of objects
    //each object contains the details of the product(tour) that we want to send
    // line_items: [
    //   {
    //     name: `${tour.name} Tour`,
    //     description: tour.summary,
    //     images: [`https://natours.dev/img/tours/${tour.imageCover}`],
    //     amount: tour.price * 100, //amount in cents
    //     currency: "usd",
    //     quantity: 1, //quantity of the product(tour) that we want to send
    //   },
    // ],

    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://natours.dev/img/tours/${tour.imageCover}`],
          },
          unit_amount: tour.price * 100, // amount in cents
        },
        quantity: 1,
      },
    ],
  });

  // 3)Create session as response

  res.status(200).json({
    status: "success",
    session: session, //session is the object that we created in the above step
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) {
    return next();
  }

  await Booking.create({ tour, user, price });

  res.redirect(req.originalUrl.split("?")[0]); //redirect to the home page
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
