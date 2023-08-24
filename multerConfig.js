const path = require('path')
var multer = require('multer');
const fs = require('fs')
//multer.diskStorage() creates a storage space for storing files.
if (!fs.existsSync("./uploads")) {
    fs.mkdirSync("./uploads");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
var upload = multer({storage:storage});
module.exports = upload;