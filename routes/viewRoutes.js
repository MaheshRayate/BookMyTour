const express = require("express");
const authControllers = require("../controllers/authController");
const viewControllers = require("../controllers/viewController");
const bookingControllers = require("../controllers/bookingController");

const router = express.Router();

router.get(
  "/",
  bookingControllers.createBookingCheckout,
  authControllers.isLoggedIn,
  viewControllers.getOverview
);
router.get("/tour/:slug", authControllers.isLoggedIn, viewControllers.getTour);
router.get("/login", authControllers.isLoggedIn, viewControllers.getLoginForm);
router.get("/me", authControllers.protect, viewControllers.getAccount);
router.get("/my-tours", authControllers.protect, viewControllers.getMyTours);

router.post(
  "/submit-user-data",
  authControllers.protect,
  viewControllers.updateUserData
);

module.exports = router;
