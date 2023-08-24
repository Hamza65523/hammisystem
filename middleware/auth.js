const jwt = require("jsonwebtoken");
const {User} = require('../models/user')


// const auth = async(req, res, next) => {
//   const token = req.header("x-auth-token");
//   if (!token)
//   return res.status(401).send("Access denied. Not authenticated...");
//   try {
//     const jwtSecretKey = process.env.JWT_SECRET_KEY;
//     const decoded = jwt.verify(token, jwtSecretKey);
//     let user = await User.findById(decoded._id).select('-password');
//     req.user = user;
//     next();
//   } catch (ex) {
//     res.status(400).send("Invalid auth token...");
//   }
// };

const errorHandler = (
  res,
  statusCode = 500,
  message = "Internal Server Error"
) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

const asyncError = (passedFunc) => (req, res) => {
  return Promise.resolve(passedFunc(req, res)).catch((err) => {
    return errorHandler(res, 500, err.message);
  });
};

module.exports = { asyncError,errorHandler};
