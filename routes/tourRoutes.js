const express = require("express");
const fs = require("fs");
const tourControllers = require("../controllers/tourControllers");
const authControllers = require("./../controllers/authController");
const reviewRouter = require("./reviewRoutes");

const router = express.Router();

// mergeParams
// This line basically means that we'll redirect the routes starting with '/:tourId/reviews' to the reviewRouter and then it will handle it
router.use("/:tourId/reviews", reviewRouter);

router
  .route("/top-5-cheap")
  .get(tourControllers.aliastop5Cheap, tourControllers.getAllTours);

// Aggregation pipeline route
router.route("/tours-stats").get(tourControllers.getTourStats);

router
  .route("/year-plan/:year")
  .get(
    authControllers.protect,
    authControllers.restrictTo("admin", "lead-guide"),
    tourControllers.getYearPlan
  );

// route for getting all the routes that are within certain distance from the specified point by you
// distance - how much long from your point
//center/:latlng - Your coordinates(or the the coordinates from where you want to find the tours)
//unit/:unit - miles or km
// /tours-within/233/center/-118.253880,34.031421/unit/mi
router
  .route("/tours-within/:distance/center/:latlng/unit/:unit")
  .get(tourControllers.getToursWithin);

// route for getting the distances of all tours from a particular point
router.route("/distances/:latlng/unit/:unit").get(tourControllers.getDistances);

router
  .route("/")
  .get(tourControllers.getAllTours)
  .post(
    authControllers.protect,
    authControllers.restrictTo("admin", "lead-guide"),
    tourControllers.createTour
  );

router
  .route("/:id")
  .get(tourControllers.getTour)
  .patch(
    authControllers.protect,
    authControllers.restrictTo("admin", "lead-guide"),
    tourControllers.uploadTourImages,
    tourControllers.resizeTourImages,
    tourControllers.updateTour
  )
  .delete(
    authControllers.protect,
    authControllers.restrictTo("admin", "lead-guide"),
    tourControllers.deleteTour
  );

// NESTED ROUTES\
//  POST - /tours/:tourId/reviews
//  GET  - /tours/:tourId/reviews
//  GET  - /tours/:tourId/reviews/:reviewId

//Up until this point, when creating new reviews, we always manually passed the tour ID and the user ID into the request body, and then created the review from there, right. That's okay during development, but of course, that's not how a review will be created in the real world. So, in the real world, the user ID should ideally come from the currently logged in user and a tour ID should come from the current tour. That should ideally be encoded right in the route, so in the URL. */
// We should get the tourId and the userId from the URL itself therfore we need to implement this so called Nested routes

// PROBLEM WITH THIS 👹👹👹👹
//In this we've actually implemented a route to create a review in the tour routes which is not ideal
// So basically we'll use mergeParams to solve this issue

// router
//   .route("/:tourId/reviews")
//   .post(
//     authControllers.protect,
//     authControllers.restrictTo("user"),
//     reviewController.createReview
//   )
//   .get(reviewController.getAllReviews);

module.exports = router;
