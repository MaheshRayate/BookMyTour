const express = require("express");

const userControllers = require("../controllers/userControllers");

const router = express.Router();
const authControllers = require("./../controllers/authController");

// signing up
router.post("/signup", authControllers.signup);

//logging user
router.post("/login", authControllers.login);

router.get("/logout", authControllers.logout);

// This line will ensure that only the logged in users will be able to accesss the routes below this line
router.use(authControllers.protect);

// To give information about the logged in user
router.get(
  "/me",

  userControllers.getMe,
  userControllers.getUser
);

// Password Forgot and Reset
router.post("/forgot-password", authControllers.forgotPassword);
router.patch("/reset-password/:token", authControllers.resetPassword);

// This route is for updating password of a logged in user
router.patch("/updateMyPassword", authControllers.updatePassword);

// This route is for updating data of a logged in user
router.patch(
  "/updateMe",
  userControllers.uploadUserPhoto,
  userControllers.resizeUserPhoto,
  userControllers.updateMe
);

// This route is for allowing a logged in user to delete his own account
router.delete("/deleteMe", userControllers.deleteMe);

// This line ensures that only admin will be able to perform the actions that are below these line
router.use(authControllers.restrictTo("admin"));

router
  .route("/")
  .get(userControllers.getAllUsers)
  .post(userControllers.createUser);

router
  .route("/:id")
  .get(userControllers.getUser)
  .patch(userControllers.updateUser)
  .delete(userControllers.deleteUser);

module.exports = router;
