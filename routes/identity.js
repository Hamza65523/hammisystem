const express = require("express");
const router = express.Router();

router.get("/",async (req, res) => {
  try{
    let response =req.user
  res.status(200).send({token:response,success:true});
} catch (err) {
  return errorHandler(  res,
    statusCode = 500,
    message = err.message)
}
});

module.exports = router;
