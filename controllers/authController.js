const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const crypto = require("crypto");

const Email = require("./../utils/email");

const cookieOptions = {
  expires: new Date(
    Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
  ),
  // secure:true, //makes it work only on https
  httpOnly: true, //for preventing cross site scripting
};

// This function is basically just for sending a token
const createSendToken = (user, statusCode, res) => {
  /*So first of all, a cookie is basically just a small piece of text that a server can send to clients. Then when the client receives a cookie, it will automatically store it and then automatically send it back along with all future requests to the same server. */

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  const token = signToken(user._id);

  res.cookie("jwt", token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);
  const url = `${req.protocol}://${req.get("host")}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome(); //This will send the email to the user

  // jwt.sign(payload, secretOrPrivateKey, [options, callback])
  //secretOrPrivateKey will be in our server and it should be always >=32 characters
  // The payload and header can be decoded but the signature is not decodable
  // JWT Token=Header+payload+Signature

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1)Check if email and password exists(Check if client puts the email and password in the input/not)
  if (!email || !password) {
    return next(new AppError("Please Provide the Email and Password", 400));
  }

  // 2)Check if user exists and password is correct

  // Since we are not showing passwords when we read data from the DB so we need to explicitly select it to get hold of password
  const user = await User.findOne({ email: email }).select("+password"); //User.findOne({email})
  console.log(user);

  /*and now remember that the function that we just defined is an instanced method. And so therefore it is available on all the user documents. And so this variable here right now is a user document, right? Because it's a result of querying the user model. And so we can now say user.correctPassword. */
  // const correct=

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect Email or Password", 401));
  }

  // 3)Now we need to check the password we entered in the input is equal to password saved in the DB
  // The password saved in DB is hashed and the password we put in the input is not hashed so to compare them we need to hash the password we put in the input so we'll do that in User model for that we'll create an instance method in user model
  // If everything is correct send JWT token to the client

  createSendToken(user, 200, res);
});

/*So up until this point, when we wanted to delete a user, we would simply delete the cookie from our browser. Right? So something like this, and then remove it. However, the thing is that we created this cookie as an http only cookie. Remember that, and so that means that we cannot manipulate this cookie in any way in our browser. So we cannot change it, and we can also not delete it. So let's just quickly take a look at that place in the code where we did that. So in the auth controller up there where we actually create that cookie so that is right here. And so again, remember, that this means that we can not manipulate the cookie in the browser in any way. Not even destroy it. So delete it. So if we want to keep using this super secure way here of storing cookies, then how are we going to be able to actually log out users on our website? Because usually with JWT authentication we just delete the cookie or the token from local storage. But well, again, that's not possible when using it this way. And so what we're gonna do instead is to create a very simple log out route that will simply send back a new cookie with the exact same name but without the token. And so that will then override the current cookie that we have in the browser with one that has the same name but no token. And so when that cookie is then sent along with the next request, then we will not be able to identify the user as being logged in. And so this will effectively then log out the user. And also were gonna give this cookie a very short expiration time. And so this will effectively be a little bit like deleting the cookie but with a very clever workaround like this, okay? */
exports.logout = (req, res, next) => {
  res.cookie("jwt", "loggedOut", {
    expiresIn: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ status: "success" });
};

// This middleware we're creating for protecting the access of some routes and giving access to only authenticated users(users having JWT Token)
exports.protect = catchAsync(async (req, res, next) => {
  // 1).Getting Token and Checking if its there

  let token;

  /*So a common practice is to send a token using an http header with the request, okay? So let's take a look at how we can set headers in Postman to send him along with the request and then also how we can get access to these headers in Express. And let's actually do that one first. So here in apt.js I think we have this nice middleware here, and so in here let's actually log to the console request.headers, Okay, so we talked about http headers before, and so this is how we can get access to them in Express. Okay, so basically to the request headers, so the ones that a client can send along with their request. Okay, and so here in Postman, let's now actually get to the route that we're actually trying to protect. And then here set a header. And let's just do a test one and set it to jonas, okay? Now I will just send this and here in Express, let's take a look at that. And so indeed here we get an object with all of the headers that are part of the request. So all of this here. And you see that there are a bunch of headers that Postman actually sends automatically along with the request for example, it says the the user-agent is Postman it also sends the host, and some other ones that we're gonna talk about later like accept for example. Now what matters here is actually the header that we set ourselves. Okay, so the test header set to jonas that we just sent in our request. Now to send a JSON web token as a header, there's actually a standard for doing that. So let's go back here, get rid of all of this. And so that standard for sending a token is that we should always use a header called authorization. Okay? So just like this and then the value of that header should always start with Bearer, okay? Because basically we bear, we have, we possess this token and then here the value of the token. So just like this random string that we got before. So let's just leave it her at this as an example, and so let's send that now. */
  // we send token in header as authorization:Bearer exdueeg32786323432

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError("You are Not logged in! Please log in to get access.", 401)
    );
  }

  // 2).Verifying Token
  //promisify expects a function and not the result of the function.Therefore we've written it like this
  // promisify(jwt.verify)(token,process.env.JWT_SECRET) it will actually be the decoded value will actually be the decoded data,so the decoded payload from this JSON web token.

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  console.log(decoded);

  // Here we've to handle errors of 2 types
  // We'll make the Global error handling middleware to handle these 2 types of errors
  // i)JsonWebTokenError - if the token is of correct format but it is not an authorised one
  // ii)If the token is expired

  // 3).Check if user still exists
  // This will check if a user logins and then for some reason that user is deleted then the token issued by that user should not be able to get access to the protected routes
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError(
        `The user belonging to this token does no longer exists!`,
        401
      )
    );
  }

  // 4).Check if user changed password after the token was issued
  // For doing this check we'll implement an instance method on the User model
  // If this condition is hit that means the password was changed by user after he got hold of the token

  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        "User Recently Changed the Password!Please Login again!",
        401
      )
    );
  }

  // GRANT ACCESS TO THE NEXT ROUTE HANDLER
  req.user = freshUser;
  res.locals.user = freshUser; //for rendering templates
  console.log("Authenticated User:", req.user);
  next();
});

// THeSE LECTURE👇👇👇👇
// These middleware is to check if the user is logged in.
// Only for rendered pages, no errors
// These middleware will execute for every route on our rendered website
// Same as protect middleware but we know that protect middleware does not execute for every route sp thses middleware will execute for every rendering route
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      //1).Verifies the token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2).Check if user still exists
      // This will check if a user logins and then for some reason that user is deleted then the token issued by that user should not be able to get access to the protected routes
      const freshUser = await User.findById(decoded.id);
      if (!freshUser) {
        return next();
      }

      // 3).Check if user changed password after the token was issued

      if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      //THERE IS A LOGGEDIN USER
      /*What we want to do in this case is make that user accessible to our templates. And how can we do that? Well, that's actually something that we didn't do before and so this is now a nice place to actually learn that. We can do response .locals and then put any variable in there. And our pug templates will then get access to them. So if I say a response .locals.user, then inside of a template there will be a variable called user. So again, each and every pug template will have access to response .locals and whatever we put there will then be a variable inside of these templates*/
      res.locals.user = freshUser;
      return next();
    } catch (err) {
      return next();
    }
  }

  next();
};

// restrictTo() middleware is for authorisation that is for giving the access of deleteTours to only admin and the lead-guide
/*So we need a way of basically passing in arguments into the middleware function in a way that usually does not work. So, how are we going to do that? Well, in here, we will actually create like a wrapper function, which will then return the middleware function that we actually want to create, okay? */
/*So, this is the restrictTo function, and in here we want to pass an arbitrary number of arguments. So, basically, of roles. And so we can use the rest parameter syntax, which is again new in ES6, and this will then create an array of all the arguments that were specified, okay? */

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles is an array. In our case it is - ['admin','lead-guide']. We want to give access of deleting the tours only to admin and lead-guide
    /*And where is the role of the current user stored? Well, let's remember the line of code that we actually put up here, right in the end where we grant access to the protected route, we store the current user in request.user. And remember how this protect middleware always runs before restrictTo, right? So, here, we first have protect, and then we have restrictTo. And so by the time this middleware function here runs, this one has already completed, and has put the current user on the request object. And so now, we can use that here. So request.user.role. So that's where the role is stored. */
    if (!roles.includes(req.user.role))
      return next(
        new AppError("You do not have permission to perform this action!", 403)
      ); //403 - action forbidden
    next();
  };
};

// Forgot Password
/*You just have to provide your email address and you will then get an email with a link where you can click and then that's gonna take you to a page where you can put in a new password. This is a very standard procedure and so this is also how we're going to implement it here in this application. 
Basically there are two steps. 
For the first one is that the user sends a post request to a forgot password route, only with this email address. This will then create a reset token and sent that to the email address that was provided. Just a simple, random token, not a JSON Web Token.  Then in the second part, which is gonna be the next video, the user then sends that token from his email along with a new password in order to update his password. Basically, we will have exports dot forgot password which is the first step. So request, response and next and then as a second step, we have reset password.*/

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1)Get user on POSTED email

  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError("There is no User with that email", 404));
  }

  // 2)Generate a random token - for generating a random token we'll be using the crypto inbuilt module. We'll be creating an instance method for this
  const resetToken = user.createPasswordResetToken();

  /*All right and so that is done, but actually what we did was just to modify the data in here in the reatePasswordResetToken . When we set this dot password expires for example to this value, we did in fact not really update the document. We did not save it. We really just modify it, but now we then need to save it. Let's say await user dot save. But watch what happens as we now use this. Let's just grab this one here. This is the route that we did find before. And now we get this route is not yet defined. Let's see why that is. In the user route, we clearly have the same url here, but I see that we actually need to do a post request. All right, okay, but now we get an error saying please provide email and password. And so that's what I meant when I said watch what happens when you try this. That happens because we're trying to save a document, but we do not specify all of the mandatory data, so the fields that we marked as required. Let's quickly fix that. All we need to do is to actually pass a special option into this user dot save method. We say validate before save set to false. This will then deactivate all the validaters that we specified in our schema. It's these small things that you need to know that will make all the difference. Now I also didn't actually know that this existed because no one really knows all of the stuff. It's impossible. A library like Mongoose is simply way too big for you to know everything there is. I went ahead and read the Mongoose documentation and so that's where I found this extremely helpful option. All of this just to say that again, no one knows everything and so it's really a good habit to if you run into some problems to take a look at the documentation for the library that you're using. Let's take a look at this now. And we still get the same error here, but I see down here that it's actually coming from the login function. Let's take a look at what's going on here. Let's take a look at the routes also. Ah, okay, so here's the problem. We are now trying to call the login handler, which of course, doesn't make sense. Here it's forgot password. Here it's reset password. And so the error that we got before was actually not because of the validation. Let's send this again and now we get the error that there is no user with this email address and so that's because we didn't specify any email address in the body. We tested that and so now it's time to actually test it with a user email. All right. And so now it shouldn't actually do anything because we're not sending back any response. Let's just cancel this because all I was really interested in is to see these tokens here and then also to take a look at the user object. This here is the original reset token, so you see it's a random hexadecimal string and then we got the encrypted one in here. This remember is the one that should not be in the database, so ending in a901. Let's take a look at that. And indeed, here it is, password reset token ending in this a901. And also the date, which is in fact 10 minutes from now. */

  await user.save({ validateBeforeSave: false }); //This makes all the validations as false. ie.it ignores all the validations

  // 3)send it to user's email
  // And as we discussed before, in the last lecture, here we actually gotta send the plain, original resetToken, and not the encrypted one. All right? We will then, in the next step, compare the original token with the encrypted one.

  try {
    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/reset-password/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset(); //This will send the email to the user

    res.status(200).json({
      status: "Success",
      message: "Token sent to email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.log(err);

    return next(
      new AppError(
        "There was an error sending the email! Try Again later!",
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token

  // The token sent to the user with the email in the last lecture was unencrypted but the actual stored in DB is an encrypted one
  // So we need to encrypt the original token so that we can compare it with the DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex"); //router.patch("/reset-password/:token", authControllers.resetPassword);

  // This will return any user if both there is passwordResetToken: hashedToken, for any user and  passwordResetExpires: { $gt: Date.now() } ie the token is not expired

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2)If the token has not expired and there is an user, set the new Password
  if (!user) {
    return next(new AppError("The token is invalid or has expired!", 400));
  }

  // Setting new Passord
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // 3)Update changedPasswordAt property for the user
  // For this step we'll create a middleware

  // 4) Log the user in, send JWT

  createSendToken(user, 200, res);
});

// Updating the password for a logged in user
// Since the user is logged in by now the protect middleware will already be executed therefore we've with us req.user because we set the req.user at last in the protect middleware

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1).Get User from Collection
  // Don't use findByIdAndUpdate 🔥🔥 see below

  const user = await User.findById(req.user.id).select("+password"); //Since by default we put restrictions on password but here we want password in the result bcoz we want to compare the password
  // 2).Check if current posted password is correct
  // For doing this we'll use the instance method correctPassword which we defined on our User model to compare an unencrypted passsword with an hashed password
  if (!user.correctPassword(req.body.currentPassword, user.password)) {
    return next(new AppError("Your Current Password is Wrong!", 401));
  }

  // 3).Update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();

  // Don't use findByIdAndUpdate 🔥🔥
  // IMP🔥🔥 - We didn't use findByIdAndDelete because the validation we've for passwordConfirm in our User model won't happen because we've set our password select:false and also we've have defined so many middlewares on 'save' they wont execute then but we need them actually
  /*So, the first one is that this validation here is not going to work, okay? And that's basically because this.password is not defined when we update, so when we use find by ID and update, because internally, behind the scenes, Mongoose does not really keep the current object in memory, and so therefore, this here is not going to work. And, as I said, I already talked about that before, so it's actually written out here as well, okay? But, it's really important to keep in mind not to use update for anything related to passwords, all right? So, this one is not going to work, and also, these two pre-saved Middlewares are also not going to work. So, if we used simply update for updating the password, then that password would not be encrypted, which is this first Middleware, and then also, the passwordChangedAt timestamp would also not be set, okay?  */

  // 4).Login user in send JWT token
  createSendToken(user, 200, res);
});
