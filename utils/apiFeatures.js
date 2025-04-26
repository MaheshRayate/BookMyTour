class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    // 1A)FILTERING
    // These will also appear in req.query object but they are not related to the database so we need to exclude them from the queryObject
    const excludedQueries = ["limit", "sort", "page", "fields"];
    excludedQueries.forEach((el) => delete queryObj[el]);

    // 1B)ADVANCED FILTERING (handling gte/lte/lt/gt operators)

    // localhost:3000/api/v1/tours?duration[gte]=5&price[lte]=400
    let queryStr = JSON.stringify(queryObj);
    console.log(queryStr);
    queryStr = queryStr.replace(/\b(gte|lte|lt|gt)\b/g, (match) => `$${match}`);
    console.log(queryStr);

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    // 2) SORTING

    if (this.queryString.sort) {
      console.log("SORTING...");
      let sortBy = this.queryString.sort;
      sortBy = sortBy.split(",");
      sortBy = sortBy.join(" ");
      console.log(sortBy);
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }

    return this;
  }

  limitFields() {
    // 3)LIMITING FIELDS(PROJECTION)

    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      // By default we'll send everything to client except the inbuilt mongoose __v
      this.query = this.query.select("-__v");
    }

    return this;
  }

  paginate() {
    // 4)PAGINATION
    // localhost:3000/api/v1/tours?page=2&limit=10
    // limit is the maximum number of documents on one page

    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    console.log(skip);

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
