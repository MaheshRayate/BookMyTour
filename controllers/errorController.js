const AppError = require("./../utils/appError");

const sendErrorDev = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith("/api")) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      stack: err.stack,
      message: err.message,
    });
  }
  // RENDERED WEBSITE
  console.log(err);
  return res.status(err.statusCode).render("error", {
    title: "Something went Wrong",
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  console.log(req.originalUrl);
  // A) FOR API
  if (req.originalUrl.startsWith("/api")) {
    // Operational trusted error:send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
      // Programming or other unknown error: dont show to client
    }
    console.error("ERROR👹👹", err);
    return res.status(500).json({
      status: "error",
      message: "Something went very wrong",
    });
    //B)For RENDERED WEBSITE
  }
  // Operational errors
  if (err.isOperational) {
    return res.status(err.statusCode).render("error", {
      title: "Something went Wrong",
      msg: err.message,
    });
    // Programming or other unknown error: dont show to client
  }
  console.error("ERROR👹👹", err);
  return res.status(err.statusCode).render("error", {
    title: "Something went Wrong",
    msg: err.message,
  });
};

const handleCastErrorDB = (err) => {
  console.log("inside handleCast");
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  // console.log("inside handleDuplicateFieldsDB")
  const duplicateField = err.errorResponse.errmsg.match(/name:\s*"([^"]+)"/);
  console.log(duplicateField);
  const message = `Duplicate Field Value:${duplicateField}.Please Use another value`;
  return new AppError(message, 404);
};

const handleValidationErrorDB = (err) => {
  console.log("Inside handleValidationErrorDB");
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid Input Data ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleJWTError = (err) => {
  const message = `Invalid Token. Please log in again`;
  return new AppError(message, 401);
};

const handleJWTExpiredError = (err) => {
  const message = `Token Expired. Please log in again`;
  return new AppError(message, 401);
};

module.exports = (err, req, res, next) => {
  console.log("NODE_ENV is:", process.env.NODE_ENV);
  // console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  console.log(err);

  if (process.env.NODE_ENV === "development") {
    console.log("DEV ERROR😄");
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    console.log("PROD ERR🔥🔥");
    /*
    In Development Mode (NODE_ENV=development):
Errors are passed directly to sendErrorDev(err, res), which logs the entire error, including the stack trace.
This is why you can see CastError properly.

In Production Mode (NODE_ENV=production):
You attempt to clone the err object using let error = {...err};, but this only copies the top-level properties.
However, err.name (which contains "CastError") is not copied because Error objects in JavaScript have properties that are non-enumerable, meaning they don’t get copied using {...err}.
Fixing the Issue:

Instead of using let error = {...err};, explicitly create a new error object with all necessary properties copied.
 */
    // let error = { ...err };

    let error = Object.assign({}, err, {
      name: err.name,
      message: err.message,
    });

    // Handling Invalid IDs
    if (error.name === "CastError") error = handleCastErrorDB(error);
    //Handling Duplicate DB Fields
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    // Handling Mongoose Validation Errors
    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);

    // Handling the JSONWebToken Error
    if (error.name === "JsonWebTokenError") error = handleJWTError(error);

    // handling Token expired error
    if (error.name === "TokenExpiredError")
      error = handleJWTExpiredError(error);

    sendErrorProd(error, req, res);
  }

  next();
};
