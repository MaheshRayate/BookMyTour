const mongoose = require("mongoose");
const Tour = require("./tourModel");

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review cannot be empty!"],
    },

    rating: {
      type: Number,
      // require:[true,'Specify Rating'],
      min: 1,
      max: 5,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "Tour",
      required: [true, "A review must belong to a tour"],
    },

    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "A review must belong to a user"],
    },
  },

  {
    // in oreder to display the virtual properties you need to include the following in the schema explicitly
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// How to Avoid Duplicate Reviews(More than 1 review by the same user and for same tour )?
// Solution 1 - Use Unique Index (But Not feasible that means one tour will get only one review and one user can put only one review. What we want is combination of user and tour to be unique )
// Solution 2 - Using Compound Index {user,tour}
// This line ensures that we wont have duplicate reviews
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name photo",
  });

  next();
});

// How can we calculate the Averagerating and noOfRatings?
/*So how are we actually going to implement this? Well back here in the review model we're gonna create a new function which will take in a tour ID and calculate the average rating and the number of ratings that exist in our collection for that exact tour. Then in the end the function will even update the corresponding tour document. Then in order to use that function we will use middleware to basically call this function each time that there is a new review or one is updated or deleted, okay. So let's now start by writing that function and for that we're actually gonna write a static method */
// this keyword in static method points to the current model
// Static Methods on Model
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: "$tour",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  // console.log(stats);

  // Putting the calculated ratingsAverage and ratingsQuantity in the tour document
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// This middleware is for calling the above declared static method
// Post middleware doesn't have next keyword
reviewSchema.post("save", function () {
  // this points to the current document(Review document) that is saved
  // The static method is called on the model but here we cannot use the model because the model (Review) is not yet defined till this line
  // If you think you can define this middleware after the declaration of the model but that's not gonna work bcoz in this way we're defining the middleware after the declaration of the model and it won't get exported to otrher modules
  // To solve this issue we'll use the this.constructor which also meand the current model
  this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.clone().findOne();

  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  // await this.findOne(); does NOT work here, query has already executed
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
