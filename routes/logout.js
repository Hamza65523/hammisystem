const { asyncError, errorHandler } = require("../middleware/auth") ;
const { cookieSetter } = require("../utils/features");
const express = require("express");
const router = express.Router();


router.get("/", async (req, res) => {
  try{
    cookieSetter(res, null, false);
    res.status(200).json({
      success: true,
      message: `Logged Out Successfully`,
    });
  } catch (err) {
    return errorHandler(  res,
      statusCode = 500,
      message = err.message)
  }
});

module.exports = router

