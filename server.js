const Tour = require("./models/tourModel");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

// Handling Errors in synchronous function(Handling Uncaught Exceptions)
/*But what exactly are uncaught exceptions?Well, all errors, or let's also call them bugs,that occur in our synchronous code but are not handled anywhere are called uncaught exceptions. */
// This should always be at the top
process.on('uncaughtException',(err)=>{
  console.log(err);
  console.log("Uncaught Exception 🔥🔥🧨 Shutting Down");
  process.exit(1);

})


dotenv.config({ path: "./config.env" }); //This should always be above these line const app = require("./index");

const app = require("./index");
const port = process.env.PORT || 3000;

// DATABASE=mongodb+srv://mahesh:Torture%40123@cluster0.svsj1.mongodb.net/

const DB = process.env.DATABASE;


mongoose.connect(DB).then((con) => {
  console.log("DB Connection Successful");
});
console.log(DB);

// 4) SERVER
console.log(app.get("env")); //environment variable set by express

const server = app.listen(port, () => {
  console.log(`Listening on Port ${port}`);
});

// HANDLING Unhandled Rejections
// These is for handling errors outside of express for ex- DB url or password incorrect
// Here we intentionally in the config.env file we put wrong DB url

process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("Unhandled Rejection 🔥🔥🧨 Shutting Down");

  server.close(() => {
    process.exit(1);
  });
});





// TEST Comment
