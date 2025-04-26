const express = require("express");
const reviewControllers = require("./../controllers/reviewController");
const authControllers = require("./../controllers/authController");

// Why we require mergeParams?
/*But why do we actually need this here? Well, it's because, by default, each router only have access to the parameters of their specific routes, right. But here, in this route, so in this URL for this post, there's of course actually no tour id. But, we still want to get access to the tour id that was in this other router, right. So this here. And so, in order to get access to that parameter in this other router, we need to physically merge the parameters, okay. And so that's what mergeParams, set to true, does. */

const router = express.Router({ mergeParams: true });

// This line ensures that every requests coming after this line then user has to be logged in
router.use(authControllers.protect);

router
  .route("/")
  .get(reviewControllers.getAllReviews)
  .post(
    authControllers.restrictTo("user"),
    reviewControllers.setTourUserIds,
    reviewControllers.createReview
  );

router
  .route("/:id")
  .get(reviewControllers.getReview)
  .delete(
    authControllers.restrictTo("user", "admin"),
    reviewControllers.deleteReview
  )
  .patch(
    authControllers.restrictTo("user", "admin"),
    reviewControllers.updateReview
  );

module.exports = router;
