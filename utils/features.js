const { serialize } =  require("cookie");
const JWT = require("jsonwebtoken");
const {errorHandler} = require("../middleware/auth");
const User = require("../models/user");

const generateToken=(user)=>{
  const secrect = process.env.JWT_SECRET_KEY 
  const payload = {
      email: user.email,
      id:user._id
  }
  const token = JWT.sign(payload,secrect,{expiresIn:'15m'})
  return token
}

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
    if(req.method =='GET'){
      const cookie = req.headers.cookie;
      if (!cookie) return errorHandler(res, 401, "Access denied. Not authenticated...")  
      const token = cookie.split("=")[1];
      const decoded = JWT.verify(token, process.env.JWT_SECRET_KEY);
      let user = await User.findById(decoded.id).select('-password');
      req.user = user;
      next();
    }else{
      return errorHandler(res, 400, "Method Not Allowed")  
    }
  }
  catch (ex) {
    return errorHandler(res, 400, "Invalid auth token...")  
  }
};
const verifyToken=(token,secret)=>{
  return JWT.verify(token, secret, (err, decoded) => {
    if (err) {
    return  {status:false}
    } else {
        return {status:true,decoded}
    }
  });
  }
module.exports ={
generateToken,
verifyToken,
cookieSetter,
checkAuth
}