const catchAsync = require("../utils/catchAsync");
const User = require("./../models/userModel");
const AppError = require("./../utils/appError");
const factory = require("./handlerFactory");
const sharp = require("sharp"); // Library for preocessing images.This is used to resize the image
// When using such library for image processing it is better to save the image in memory instead of saving it to disk. This is because processing images in memory is usually faster and more efficient than reading and writing files to disk. It also allows for more flexibility in how the image is processed and manipulated before being saved to disk or sent to a client.
const multer = require("multer");

// const multerStorage = multer.diskStorage({
//   //This callback has access to the current request object, the current file object, and a callback function (cb) similar to the next function in express. The cb function is used to indicate whether the file should be accepted or rejected.
//   destination: (req, file, cb) => {
//     cb(null, "public/img/users");
//   },
//   // This will take care of the nameing of the file that we will upload
//   // The filename function is called for each file that is uploaded. It receives the request object (req), the file object (file), and a callback function (cb) as arguments.
//   filename: (req, file, cb) => {
//     //For naming the file we'll use this format user-<userId>-<timestamp>.jpeg  user-76gdvd652788hdhdfv-1654654654.jpeg
//     // the extension of the file ie. jpeg we'll get from the file.mimetype
//     //we'll use the split method to get the extension of the file
//     const ext = file.mimetype.split("/")[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

const multerStorage = multer.memoryStorage(); // This will store the image in memory instead of saving it to disk and we can access it using req.file.buffer. This is useful when we want to process the image before saving it to disk or sending it to a client.

const multerFilter = (req, file, cb) => {
  // This function is used to filter the files that are uploaded. It checks if the file type is an image (JPEG, PNG, or GIF) and calls the callback function accordingly.
  //We'll use the mimetype property of the file object to check the type of the file. The mimetype is a string that indicates the media type of the file. For example, an image file might have a mimetype like "image/jpeg" or "image/png".
  //If the mimetype starts with "image", we accept the file. Otherwise, we reject it.
  //The cb function is a callback function that takes two arguments: an error (if any) and a boolean value indicating whether the file should be accepted(true) or rejected(false).
  if (file.mimetype.startsWith("image")) {
    cb(null, true); // Accept the file
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false); // Reject the file
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single("photo"); // This will upload the file to the public/img/users folder

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next(); // If there is no file, we just call the next middleware

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`; // This will give us the name of the file that we uploaded
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`); // This will save the image to the public/img/users folder with the name that we specified above

  next();
});
// For filtering the req.body
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });

  return newObj;
};

// This is for updating data of a user who is logged in by himself/herself
// We will not update password here bcoz for password we've created a separate route
exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log(req.file); // This will give us the file that we uploaded
  // console.log(req.body); // This will give us the data that we sent in the body

  // 1).Create error if user POSTS password

  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This Route is not for password updates. Please use /updateMyPassword",
        400
      )
    );
  }

  // 2) Filtered out wanted fields that are not allowed to update

  // we'll create these function filterObj where it will filter the req.body to only update the name and  email because we dont want user to update any other things
  const filteredBody = filterObj(req.body, "name", "email");
  //To save the image name to the database, we need to add the photo property to the filteredBody object. This will be done only if a file is uploaded.
  if (req.file) {
    filteredBody.photo = req.file.filename; // This will give us the name of the file that we uploaded
  }
  // 3)Update User Document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    runValidators: true,
    new: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

// For allowing a logged in user to delete his own account
/*Now when a user decides to delete his account, we actually do not delete that document from the database. But instead we actually just set the account to inactive. So that the user might at some point in the future reactivate the account and also so that we still can basically access the account in the future, even if officially, let's say it has been deleted. Okay? So to implement this, first of all we need to create a new property in our schema. So, let's go there. And now we want to have a field called active. Okay. Which should be of the type Boolean. Okay, and by default it's gonna be true. So any user that is created new is of course an active user and so the Boolean is set to true. Also, we do not want to show this in the output, okay. Because we basically want to hide this implementation detail from the user. Okay? And so we don't want anyone to know that this flag, so this active flag is here, okay. So we say select, and set it to false, all right. And so, to delete the user now, all we need to do is basically set that active flag to false. */
// We just want to set the active field to false
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: "success",
    data: null,
  });

  /*Now as a last step, we then of course do not want to show up the inactive users in this output, right. And how do you think we could implement this? Well we're gonna use something that is way back that we talked about like two or three sections ago which is query middleware, okay. So query middleware is perfect for this because now we can basically add a step before any other query that we're doing then somewhere in our application. So let's go to our user model here and add that middleware here. */
  // We'll implement a query middleware so that when user executes a query that middleware will run before giving result of the query and there we'll only return that users whose active:true
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not defined. Please up signup instead!",
  });
};

// Middleware for setting the id in the URL to that of the id of the Logged in user
// We'll call this middleware whicle executing /me route
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// We'll not use factory function createOne for user beacuse we've the signup for that

exports.getUser = factory.getOne(User);
exports.getAllUsers = factory.getAll(User);
exports.updateUser = factory.updateOne(User); // Don't use this for updating password
exports.deleteUser = factory.deleteOne(User);
