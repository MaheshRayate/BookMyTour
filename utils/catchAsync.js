// Read info.txt for proper explanation
module.exports=catchAsync=fn=>{
    return (req,res,next)=>{
      // fn(req,res,next).catch(err=>next(err));
      fn(req,res,next).catch(next); //same as above
    }
  
  }