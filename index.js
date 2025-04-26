// This file contains everything related to express
const path = require("path");
const express = require("express");
const morgan = require("morgan");
const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const viewRouter = require("./routes/viewRoutes");
const bookingRouter = require("./routes/bookingRoutes");
const compression = require("compression"); //for compressing the response data

const AppError = require("./utils/appError");

//Express File
// Security packages
const rateLimit = require("express-rate-limit"); //rate limiter for limiting requests from a single IP
const helmet = require("helmet"); //set http headers
const mongoSanitize = require("express-mongo-sanitize"); //sanitization for nosql query injections
const xss = require("xss-clean"); //sanitization for xss
const hpp = require("hpp"); //preventing http parameter pollution
const cookieParser = require("cookie-parser"); //parsing cookies

const globalErrorHandler = require("./controllers/errorController");

const app = express();

app.set("view engine", "pug"); //to set the template engine
app.set("views", path.join(__dirname, "views")); //this.path.join(__dirname, "views") = __dirname/views

// 1) MIDDLEWARES

// Serving static files
app.use(express.static(path.join(__dirname, "public")));

// Middleware to set http headers
// app.use(helmet());

// We'll implement this middleware for limiting more than 100 requests from a single IP
// To prevent Denial of service and Brute force attacks

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, //1 hour
});

app.use("/api", limiter);

// Body parser
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" })); //for parsing data from urlencoded forms

app.use(cookieParser()); //for parsing data from cookies

app.use(mongoSanitize());

app.use(xss());

app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  })
);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use((req, res, next) => {
  console.log("Hello from the custom Middleware 1 😄😄");
  next();
});

app.use(compression()); //for compressing the response data

app.use((req, res, next) => {
  // console.log(req.cookies);
  next();
});

// 3) ROUTES

app.use("/", viewRouter);

app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/bookings", bookingRouter);

// 4) Handling Unhandled Routes

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// GLOBAL ERROR HANDLING MIDDLEWARE

app.use(globalErrorHandler);

module.exports = app;
