const mongoose = require("mongoose");
const validator = require("validator"); //Third party library for validation
const bcrypt = require("bcryptjs");
const crypto = require("crypto"); //Built in module

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please Provide your Name"],
  },
  email: {
    type: String,
    required: [true, "Please Provide your Email"],
    unique: true,
    lowercase: true,

    validate: [validator.isEmail, "Please Provide a valid Email"],
  },

  photo: {
    type: String,
    default: "default.jpg",
    // This is the default image that will be used if user does not upload any image
  },

  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user",
  },

  password: {
    type: String,
    required: [true, "Provide a Password"],
    minlength: 8,
    select: false, // makes it invisible to client (No one can see this)
    // So that for get All User route/other routes the passwords are not visible
  },

  passwordConfirm: {
    type: String,
    required: [true, "Confirm you Password"],
    validate: {
      // This only works on CREATE and SAVE!!!
      //
      validator: function (el) {
        return el === this.password;
      },

      message: "Passwords do not Match",
    },
  },

  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// This middleware will run everytime a query starting with find is executed and it will filter out the results for the query in such a way that it only returns the user that has active:true
userSchema.pre(/^find/, async function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.pre("save", async function (next) {
  // If password is not modified return and call next middleware
  if (!this.isModified("password")) return next();

  // if password is modified
  // 12 is cost parameter (higher the cost parameter higher the security but higher the time it takes to hash the password)
  // this hash is asynchronous megthod
  // there is a synchronous versionas well but it blocks the code
  this.password = await bcrypt.hash(this.password, 12);

  // We'll not hash the passwordConfirm, actually we'll not store ikt in DB we require it only for validation
  //Setting it to undefined
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

/*Instance method - So an instance method is basically a method that is gonna be available on all documents of a certain collection, okay?*/
// candidate Password is the password that user inputted now while logging and userPassword is the Password that is saved in DB(hashed password) for that user
//this keyword points to the current document
/*But in this case, since we have the password set to select false, so this here, remember? Okay, and because of that, this.password will not be available. */
/*So the goal of this function is to really only return true or false. So basically true if the passwords are the same, and false if not. */
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  // bcrypt.compare(candidatePassword,userPassword) will compare the unhashed(candidatePassword) and the hashed password(userPassword)
  return await bcrypt.compare(candidatePassword, userPassword);
};

// This instance method is to check if user has changed password
// JWTTimestamp refers to the time when the token was issued
// And by default, we will return false from this method.And that will then meanthat the user has not changed his password after the token was issued.
/*Now, we actually need to create a field now in our schema for the date where the password has been changed. So we don't have that yet. */
/*Now, this passwordChangedAt property here will always be changed, of course, when someone change the password. So right now, we don't have that logic anywhere, and so nowhere we are actually defining this property. And so, most of the documents, so most of the users, they will simply not have this property in their data, so in their object, right? */

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  // console.log(this.passwordChangedAt);
  if (this.passwordChangedAt != undefined) {
    console.log("Here I'm🐶🐶🐶 stuck in changedPasswordAfter");
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    // console.log(changedTimeStamp, JWTTimestamp);

    return JWTTimestamp < changedTimeStamp;
    // if this is true we'll throw error see that in authController.js
  }

  // by default, we will return false because we assume that the user did not change the password
  return false;
};

/*The password reset token should basically be a random string but at the same time, it doesn't need to be as cryptographically strong as the password hash that we created before. We can just use the very simple, random bytes function from the built-in crypto */
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex"); //unencrypted still
  // We'll not save this unencrypted token in the DB
  // This unencrypted token we'll send to user whose password is to be reset
  // And we'll encrypt the resetToken and save that in our DB so that any hacker wont able to decrypt it

  // Now it got encrypted this is for the purpose for saving it in our DB
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // console.log({ resetToken }, this.passwordResetToken); //NEW ES6 way to log a variable with its variable name //and I'm logging in here as an object because this way, it will then actually tell me the variable name along with its value.

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; //Validity of token 10 minutes

  return resetToken; //For the user we'll send the unencrypted token to his mail and then compare the encypted version of it saved in DB  while resetting the password
  // In the next video we'll see how can we send the mail to the user
};

const User = mongoose.model("User", userSchema);
module.exports = User;
