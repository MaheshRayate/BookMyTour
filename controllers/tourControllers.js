const Tour = require("../models/tourModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

const factory = require("./handlerFactory");

const sharp = require("sharp"); // Library for preocessing images.This is used to resize the image
const multer = require("multer"); //for uploading files(images in this case)

const multerStorage = multer.memoryStorage(); // This will store the image in memory instead of saving it to disk and we can access it using req.file.buffer. This is useful when we want to process the image before saving it to disk or sending it to a client.
const multerFilter = (req, file, cb) => {
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

exports.uploadTourImages = upload.fields([
  {
    name: "imageCover",
    maxCount: 1,
  },
  {
    name: "images",
    maxCount: 3,
  },
]);
// upload.single("imageCover") for single file upload  //req.file
//upload.array("images",5) for multiple file upload  //req.files
//upload.fields("") for multiple file upload with different field names  //req.files

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next(); // If there is no file, we just call the next middleware

  // 1) Cover image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Images
  req.body.images = [];

  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );

  next();
});
// Alias route
exports.aliastop5Cheap = (req, res, next) => {
  (req.query.limit = "5"),
    (req.query.sort = "-ratingsAverage,price"),
    (req.query.fields = "name,price,duration,ratingsAverage,summary");
  next();
};

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    // This array represents different stages
    // {
    //   $match: { ratingsAverage: { $gte: 4.5 } },
    // },
    {
      $group: {
        _id: { $toUpper: "$difficulty" },
        numTour: { $sum: 1 },
        numRatings: { $sum: "$ratingsQuantity" },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        maxPrice: { $max: "$price" },
        minPrice: { $min: "$price" },
      },
    },
    {
      $sort: { avgPrice: 1 },
      // We'll not use the original fields we'll use the above alias fields
      // 1 for sorting in ascending order
    },
    // {
    //   $match: { _id: { $ne: "EASY" } },
    // },
  ]);

  res.status(200).json({
    status: "success",
    result: stats.length,
    data: {
      stats,
    },
  });
});

// We'll implement this using aggregation pipeline (unwinding and Projection)
// implement a function to calculate the busiest month of a given year. So basically by calculating how many tours start in each of the month of the given year.

exports.getYearPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const yearPlan = await Tour.aggregate([
    {
      // $unwind - Deconstructs an array field from the input documents to output a
      // document for each element. Each output document is the input document with the value of the array field replaced by the element.
      $unwind: "$startDates",
    },
    {
      $match: {
        // We only want tours of that year
        startDates: {
          // year-month-date
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },

    {
      $group: {
        // $month - helps to extract the month from the date
        _id: { $month: "$startDates" },
        numTourStarts: { $sum: 1 },
        // we want to show the name of the tours therefore we create an array with name tours and then push the tour names in it
        tours: { $push: "$name" },
      },
    },
    {
      // adding another field month
      $addFields: { month: "$_id" },
    },
    {
      // 0 to not show and 1 to show
      // we'll remove the id field
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { month: 1 },
      // sorting according to month
    },

    // {
    //   $limit:6
    // }
  ]);

  res.status(200).json({
    status: "success",
    result: yearPlan.length,
    data: {
      yearPlan,
    },
  });
});

//Geospatial Queries
// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.031421,-118.253880,/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");
  const radius = unit === "mi" ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        "Please provide latitude and longitude in the format lat,lng",
        400
      )
    );
  }

  //geoWithin Operator - Selects geometries within a bounding GeoJSON geometry. The 2dsphere and 2d indexes support $geoWithin.
  //And so now we need to pass the information here into the geo within operator, okay? And we do that by defining a center sphere. Okay, and again, I know that this looks quite confusing, but that's why I'm explaining it here step by step. And also in a second, we're going to take a look at the documentation. So the center sphere operator takes an array of the coordinates and of the radius. And let's actually format the code here to at least make it look a bit easier, okay? Well it kind of looks the same, but anyway, that's how you find the coordinates here. And for that, we need yet another array, and then the longitude and the latitude. And that's right. You first need to always define the longitude and then the latitude, which is a bit counterintuitive because usually coordinate pairs are always specified with the latitude first, and the longitude first. I think I mentioned it before that in geo adjacent, it for some reason works like this. So that is the center of the sphere. Now we need to specify it's radius. Now here we actually do not pass in the distance, but instead it expects a radius in a special unit called radians. So let me put radius variable here, and then in a second we are going to define it. So let's now actually define the radius. So again, the radius is basically the distance that we want to have as the radius, but converted to a special unit called radians. And in order to get the radians, we need to divide our distance by the radius of the earth.
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
    //center sphere operator takes an array of the coordinates and of the radius
    // radius is the actual distance within which we want to find the tours but it cannot be in miles or km but it has to be in special unit called radians (distance in km/miles)/radius of earth
    // in GeoJSON we specify longitude first which is contradictory to what we use in google maps or generally
  });

  res.status(200).json({
    status: "success",
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

// controller for getting the distances of all tours from a particular point
// /distances/:latlng/unit/:unit
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(",");
  console.log(lat, lng);

  // Since the distances we get is in meteres we need to convert it to km and miles accordingly
  const multiplier = unit === "mi" ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        "Please provide latitude and longitude in the format lat,lng"
      ),
      400
    );
  }

  // In geospatial aggregation the geoNear stage has to be the first stage
  //Something else that's also very important to note about geoNear is that it requires that at least one of our fields contains a geospatial index. Actually we already did that before, so let's again take a look.
  /*If there's only one field with a geospatial index then this geoNear stage here will automatically use that index in order to perform the calculation. But if you have multiple fields with geospatial indexes then you need to use the keys parameter in order to define the field that you want to use for calculations. So keep that in mind, but again, in this case we only have one field, and so automatically that startLocation field is going to be used for doing these calculations. */
  // near is the point from which we want to calculate distances and it has to be type of geoJSON
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng * 1, lat * 1], //*1 for converting to number
        },

        distanceField: "distance", //this is the field where the distance will be calculated and stored
        distanceMultiplier: multiplier, //this field multiplies the distance with the number mentioned here. The distance is calculated in meteres (In this case for km we'll multiply by 0.001 and for miles we will multiply by)
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: "success",

    data: {
      data: distances,
    },
  });
});

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: "reviews" }); //We also have the populate option as an arguement
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);
