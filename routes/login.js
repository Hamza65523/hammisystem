const bcrypt = require("bcrypt");
const User  = require("../models/user");
const Joi = require("joi");
const express = require("express");
const router = express.Router();
const {generateToken, cookieSetter} = require("../utils/features");
const JWT = require("jsonwebtoken");

const nodemailer = require('nodemailer')
router.post("/", async (req, res) => {
  try{
  const schema = Joi.object({
    email: Joi.string().min(3).max(200).required().email(),
    password: Joi.string().max(200).required(),
  });

  const { error } = schema.validate(req.body);

  if (error) return res.status(400).render('login', { data: { status: false, message: error.details[0].message }, });

  let user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).render('login', { data: { status: false, message: 'Invalid email...' }, });
  
  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword) return res.status(400).render('login', { data: { status: false, message: 'Invalid password...' }, });
  
  const token = generateToken(user._id);
  cookieSetter(res, token, true);
  
res.status(200).render('login', { data: { status: true, message: 'Login Successfully...',token:token }, });
  
} catch (err) {
  return  res.status(500).render('login', { data: { status: false, message: err.message }, });
}

});
router.get("/",  (req, res) => {
  res.render('login');
});

const sendResetPasswordMail = async(name,email,link,res)=>{
      let transporter = nodemailer.createTransport({
          host: "smtp.freesmtpservers.com",
          port:25,
          secure:false,
          requireTLS:false,
          auth:{
              user:process.env.USER,
              pass:process.env.PASS
          }
      })
      let info =  await transporter.sendMail({
          from:'notify@hammi.info',
          to:`${email}`,
          subject:'Password Forget',
          text:'Hello',
          html: `
          <p>Hello ${name},</p>
          <p>This is a reset link:</p>
          <a href="${link}" style="display:inline-block; padding:10px; background-color:#007bff; color:#fff; text-decoration:none; border-radius:5px;">Reset Password</a>
        `
      })
      console.log("Message sent: %s", info.messageId);
      console.log("Message sent: %s", link);
      res.status(200).render('forgot', { data: { status: true, message: 'Reset link sent to your email' }, });
}
router.post('/forgot-password', async (req, res) => {
  const schema = Joi.object({
    email: Joi.string().min(3).max(200).required().email(),
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).render('forgot', { data: { status: false, message: error.details[0].message }, });

  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).render('forgot', { data: { status: false, message: 'User not found' }, });

    const secrect = process.env.JWT_SECRET_KEY 
    const payload = {
        email: user.email,
        id:user._id
    }
    const token = JWT.sign(payload,secrect,{expiresIn:'15m'})
    const link = `${process.env.BASEURL}/api/login/update-user/${user._id}/${token}`
    sendResetPasswordMail(user?.name,user?.email,link,res)
  } catch (error) {
    console.error('Error:', error);
      return  res.status(500).render('forgot', { data: { status: false, message: error.message }, });
  }
});
router.get("/forgot-password",  (req, res) => {
  res.render('forgot');
});

router.post('/update-user/:id/:token', async (req, res) => {
  const schema = Joi.object({
    name: Joi.string().min(3).max(30).required(),
    email: Joi.string().min(3).max(200).required().email(),
    password: Joi.string().min(6).max(200).required(),
  });

  const { error } = schema.validate(req.body);
  if (error) return res.status(400).render('updateuser', { data: { status: false, message: error.details[0].message }, });


  let { name, email ,password} = req.body;
  const userId = req.params.id;
  const secret = process.env.JWT_SECRET_KEY;
    let user = await User.findById({ _id: userId });
    if (user !== null && user.id !== undefined) {
      if (userId !== user.id) {
        return res.status(400).render('updateuser', {
          data: { status: false, message: 'Invalid Id' },
        });
      }
    } else {
      console.log("User object is null or id is undefined.");
    }
 
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    // Update user's password
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name,email,password: hashPassword }, // Update only the password field
      { new: true } // Return the updated user
    );
      console.log(updatedUser,'password',user)
    if (!updatedUser) return res.status(404).render('updateuser', { data: { status: false, message: 'User not found' }, });
    res.status(200).render('updateuser', { data: { status: true, message: 'User profile updated successfully',user: updatedUser,}, });
}

  
)
router.get("/update-user/:id/:token", async(req, res) => {
  const {id,token} = req.params;
  let user = await User.findById(id)
  if(id !== user.id){
  return  res.status(400).render('updateuser', { data: { status: false, message: 'Invalid Id' }, });
  }

// Secret key used for signing the token (should be the same as when creating the token)
const secret = process.env.JWT_SECRET_KEY;
let {status,decoded} =verifyToken(token,secret)
if(status ==true){
  res.render('updateuser',{email:decoded.email});
}else{
  return  res.status(400).render('updateuser', { data: { status: false, message: 'Link Expire' }, });
}

});

const verifyToken=(token,secret)=>{
return JWT.verify(token, secret, (err, decoded) => {
  if (err) {
    console.log(err)
  return  {status:false}
  } else {
      console.log('Token verified:', decoded);
      return {status:true,decoded}
  }
});
}


module.exports = router;
