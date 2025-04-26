const express = require("express");
const bookingControllers = require("../controllers/bookingController");
const userControllers = require("../controllers/userControllers");
const authControllers = require("./../controllers/authController");
const factory = require("./../controllers/handlerFactory");

const router = express.Router();

router.use(authControllers.protect);
router.get("/checkout-session/:tourID", bookingControllers.getCheckoutSession);

router.use(authControllers.restrictTo("admin", "lead-guide")); //only admin and lead-guide can access the following routes
router
  .route("/")
  .get(bookingControllers.getAllBookings) //get all bookings
  .post(bookingControllers.createBooking);

router
  .route("/:id")
  .get(bookingControllers.getBooking)
  .patch(bookingControllers.updateBooking)
  .delete(bookingControllers.deleteBooking); //get a booking, update a booking and delete a booking

module.exports = router;
