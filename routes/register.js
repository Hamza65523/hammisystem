const bcrypt = require("bcrypt");
const User  = require("../models/user");
const express = require("express");
const {generateToken,cookieSetter,} = require("../utils/features");
const router = express.Router();
const Joi = require("joi");



router.post("/", async (req, res) => {
  try {
    const schema = Joi.object({
        name: Joi.string().min(3).max(30).required(),
        email: Joi.string().min(3).max(200).required().email(),
        password: Joi.string().min(6).max(200).required(),
    });
 
    const { error } = schema.validate(req.body);

    if (error) return res.status(400).render('registration', { data: { status: false, message: error.details[0].message },  });

    let user = await User.findOne({ email: req.body.email });
    if (user) return res.status(400).render('registration', { data: { status: false, message: 'User already exists...' },  });

    const { name, email, password } = req.body;

    user = new User({ name, email, password });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    await user.save();
    
    // Handle the successful registration scenario
    res.status(201).render('registration', { data: { status: true, message: 'Registered Successfully' }, });
} catch (err) {
    console.error('Error during registration:', err);
    res.status(500).render('registration', { data: { status: false, message: 'An error occurred during registration' }, });
}
});
router.get("/",  (req, res) => {
  res.render('registration');
});

module.exports = router;
