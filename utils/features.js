const { serialize } =  require("cookie");
const jwt = require("jsonwebtoken");
const {errorHandler} = require("../middleware/auth");
const { User } = require("../models/user");

const cookieSetter = (res, token, set) => {
  res.setHeader(
    "Set-Cookie",
    serialize("token", set ? token : "", {
      path: "/",
      httpOnly: true,
      maxAge: set ? 15 * 24 * 60 * 60 * 1000 : 0,
    })
  );
};


const checkAuth = async (req,res,next) => {
  try {
  const cookie = req.headers.cookie;
  if (!cookie) return errorHandler(res, 401, "Access denied. Not authenticated...")  

  const token = cookie.split("=")[1];
  
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  let user = await User.findById(decoded._id).select('-password');
  req.user = user;
  next();
  }
  catch (ex) {
    return errorHandler(res, 400, "Invalid auth token...")  
  }
};


module.exports ={
cookieSetter,
checkAuth,
}