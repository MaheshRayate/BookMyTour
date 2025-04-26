const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const APIFeatures = require("../utils/apiFeatures");

// We were writing the same duplicate code for creating,deleting,updating different types of documents
// Mow by creating a factory fuction we'll create a generalised function for doing this task and we'll then passs the model as an arguement to this factory fucntion

exports.deleteOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    // 204 means no content because we dont want to show anything when we want to delete something

    if (!doc) {
      return next(new AppError("Document Not Found with the given ID", 404));
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  });
};

// Different syntax if we dont specify curly brackets it means return
// Yes, in JavaScript, if there are no curly brackets {} after a function's name (in arrow functions), it implies an implicit return. This behavior is specific to arrow functions.

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError("Document Not Found with the given ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

// In this findOne factory function we're passing popOptions because we required to populate for the getTour function where we need to populate the reviews in the tour

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    // Tour.findById(req.params.id) = Tour.findOne({_id:req.params.id})

    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(new AppError("Document Not Found with the given ID", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // To allow the Nested for GEt Reviews on tour
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    // console.log(req.query);

    // EXECUTE QUERY
    const features = new APIFeatures(Model.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // The explain() method gives the statistics of the query itself
    // const doc = await features.query.explain();
    const doc = await features.query;

    res.status(200).json({
      status: "success",
      result: doc.length,
      data: {
        data: doc,
      },
    });
  });
