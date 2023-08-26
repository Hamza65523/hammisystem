const { serialize } =  require("cookie");
const JWT = require("jsonwebtoken");
const {errorHandler} = require("../middleware/auth");

const generateToken=(user)=>{
  const secrect = process.env.JWT_SECRET_KEY 
  const payload = {
      email: user.email,
      id:user._id
  }
  const token = JWT.sign(payload,secrect,{expiresIn:'15m'})
  return token
}

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
verifyToken
}