const fs = require("fs");

const Tour = require("./../../models/tourModel");
const User = require("./../../models/userModel");
const Review = require("./../../models/reviewModel");

const dotenv = require("dotenv");
const mongoose = require("mongoose");
dotenv.config({ path: "./config.env" }); //This should always be above these line const app = require("./index");

// DATABASE=mongodb+srv://mahesh:Torture%40123@cluster0.svsj1.mongodb.net/

const DB = process.env.DATABASE;
console.log(DB);

mongoose.connect(DB).then((con) => {
  //   console.log(con.connections);
  console.log("DB Connection Successful");
});
// console.log(DB);

// READING JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, "utf-8"));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, "utf-8"));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, "utf-8")
);

// IMPORTING ALL THE DATA INTO DATABASE

const importData = async () => {
  try {
    // Tour.create can also accept an array
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log("Data successfully loaded!");
  } catch (err) {
    console.log(err);
  }
};

// TO DELETE ALL DATA IN THE DATABASE
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log("Data Deleted Successfully!");
  } catch (err) {
    console.log(err);
  }
};

// We'll execute both the deleteData and importData from the Command line
// So we're going to run this file using the Command Line

console.log(process.argv);

if (process.argv[2] === "--import") {
  importData();
  // process.exit();
} else if (process.argv[2] === "--delete") {
  console.log("Deleteing.....");
  deleteData();
  // process.exit();
}
