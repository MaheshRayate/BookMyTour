class AppError extends Error{
    constructor(message,statusCode){

        /*'Why didn't I set this.message equal to message?'Well, that's just because right here I called the parent class, right, and the parent class is error, and whatever we pass into it is gonna be the message property.So just as I told you before. And so, basically, in here by doing this parent call we already set the message property to our incoming message. */

        super(message); //calling parent constructor

        this.statusCode=statusCode;
        this.status=`${statusCode}`.startsWith('4')?'fail':'error';
        // we're checking if the status code is 404 then the status will be fail if not the status will be error

        /*All right, now next up,all the errors that we will create using this class will all be operational errors. So, errors that we can predict will happen in some point in the future, like for example a user creating a tour without the required fields, right? So that is an operational error, okay, and so again, from now on, we will always use this AppError class here that we're creating right now in order to create all the errors in our application. And so these errors will be operational errors, and so what I'm gonna do now is to actually also create a .is operational property here. So this.is operational, and set it to true. */
        this.isOperational=true;

        /*So err.stack will basically show us where the error happened. So let me run this here now, and so let's take a look at this, and so it gives us here the error and then also where it happened, okay? */

        Error.captureStackTrace(this,this.constructor);
        /*This method removes the constructor (AppError) from the stack trace to make debugging cleaner. 
        err.stack normally includes all functions in the call stack, but calling Error.captureStackTrace ensures the trace starts where the actual error happened, not in our AppError class. */

    }
}

module.exports=AppError;