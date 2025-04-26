const mongoose = require("mongoose");
const validator = require("validator"); //library for validating strings
const User = require("./userModel");
const slugify = require("slugify");

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A tour must have a Name"], //required is a validator
      unique: true, //unique is not a validator
      trim: true, //TO remove white spaces from beginning and end
      maxlength: [40, "A tour name must have less or equal then 40 characters"], //for strings
      minlength: [10, "A tour name must have more or equal then 10 characters"], //for strings

      // Using validator library for validating the name string
      // isAlpha:checks if the string contains only letters (a-zA-Z).
      // SYNTAX - to use 3rd party libraries for validation
      // validate:[validator.isAlpha,'The tour name should only contain characters']
    },

    slug: String,

    duration: {
      type: String,
      required: [true, "A tour must have a duration"],
    },

    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
    },

    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      // this validator is for string
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty is either easy,medium,difficult",
      },
    },

    ratingsAverage: {
      type: Number,
      default: 4.5,
      // This validator is for number and dates also
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
      set: (val) => Math.round(val * 10) / 10, //4.666666 ==> 4.7
    },

    ratingsQuantity: {
      type: Number,
      default: 0,
    },

    price: {
      type: Number,
      required: [true, "A tour must have price"],
    },

    priceDiscount: {
      type: Number,
      // the function should be regular we want the this keyword
      // it has arguement that is the value of discountPrice
      // this points to the current document
      // val represents the value of the field where we are imposing validation in our case it is price discount

      /*Now there is one very important caveat that we need to notice here 
      and that is that inside a validator function, that this key word is only gonna point 
      to the current document when we are creating a new document.So this function here is not going to work on update. */
      // this only points to current document on NEW Document creation
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: "The discountPrice ({VALUE}) should be less than price",
        // This message has access to the value of the field
        // This is completely mongoose feature and not JS
      },
    },

    // secret tour
    secretTour: {
      type: Boolean,
    },

    summary: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      required: [true, "A tour must have description"],
    },

    imageCover: {
      type: String,
      required: [true, "A tour must have cover image"],
    },

    images: [String],

    createdAt: {
      type: Date,
      default: Date.now(),
      // select:false,
      // If you dont want send this to the user
    },

    startDates: [Date],

    startLocation: {
      // geoJSON to specify data
      // this entire object is called a geoJSON type object which is useed to specify the geospatial data
      //The outer type refers to the data type of location, which is an object.The inner type inside location refers to the GeoJSON type (e.g., "Point"), which is required by MongoDB.

      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },

      coordinates: [Number], //[longitude,latitude] //[766235326,-9868726343]
      address: String,
      description: String,
    },
    // In order to create new documents and embed them in an collection we need to create an array therefore we'll use this this locations array
    // By specifying this we can embed the locations document in our Tours document
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        address: "String",
        description: "String",
        day: Number,
      },
    ],

    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
  },

  {
    // in oreder to display the virtual properties you need to include the following in the schema explicitly
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for efficient query searching
/*
Indexes in MongoDB are special data structures that store a small portion of the collection's data in a way that makes queries faster.
They work like an index in a book, helping MongoDB locate documents more efficiently instead of scanning every document in a collection.
By default, MongoDB creates an index on the _id field for every collection.
Without indexes, MongoDB performs a full collection scan for queries, which is slow for large datasets.
Indexes improve query performance by allowing MongoDB to find documents quickly.

📌 When Not to Use Indexes?
❌ If your dataset is small (full collection scans are fast).
❌ If you perform more writes than reads (indexes slow down inserts/updates).
❌ If an index is never used in queries (it consumes extra storage).

📌 Which field to Index?
Index those fields which are mostly used in queries
*/

// 1 means we sort ascendingly -1 means we sort descendingly

// tourSchema.index({ price: 1 }); //(Single Field Index) because we've only field in the index
tourSchema.index({ price: 1, ratingsAverage: -1 }); //(Compound Index) generally used when the query has more than 2 parameters

tourSchema.index({ slug: 1 });
//Geospatial index
tourSchema.index({ startLocation: "2dsphere" }); //2dsphere - real points on earth else 2d - non real points

tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour", //And so, this is the name of the field in the other(Review) model.So in the Review model in this case,where the reference to the current model(Tour) is stored.And that is, in this case, the Tour field
  localField: "_id", //So, we need to say where that ID is actually stored here in this current Tour model.
});

tourSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

// This middleware is for when user creates a new tour it will see the guides id's in the array and embed those user documents in that tour
// Although we will use referencing for this relationship we wont use embedding

// tourSchema.pre("save", async function (next) {
//   // This variable guidePromises is an array of promises therefore we are using Promise.all()
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });

  // the time
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: "guides",
    select: "-__v -passwordChangedAt", //We don't want to populate this fields while showing them in our tour document therfore we used -
  });

  next();
});

// tourSchema.post(/^find/, function (docs, next) {
//   console.log(`Query took ${Date.now() - this.start} milliseconds`);
//   next();
// });

// 3) AGGREGATION MIDDLEWARE - aggregation middleware allows us to add hooks
// before or after an aggregation happens,
/*USECASE - and so let's now actually continue with our previous example where we did hide the secret tour from the queries, now in an aggregation the secret tour are still being used, right? So let's quickly confirm that actually, for example here in our gets tour stats,so that's where we used the first aggregationand so you see we have four tours here,four in easy, and three in medium and so that makes 11 but we already know that we actually only want 10 tours. So there are 10 tours that are not secret, and one that is secret, and so now we get all these 11 tours here and so basically we also want to exclude the secret tour in the aggregation. */
// this is going to point to the current aggregation object.
// this.pipeline() will represent aggregation stages array

// tourSchema.pre("aggregate", function (next) {
//   console.log(this.pipeline());
//   // this statement will add one stage in the aggregation stages array where it will filter out those document where secretTour:{$ne:true}}}
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
