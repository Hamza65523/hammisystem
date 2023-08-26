const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const {
  register,
login,
Identity,
} = require("./routes/index");
const { auth } = require("./middleware/auth");
const app = express();
const bodyParser = require('body-parser')

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

require("dotenv").config();

app.use(express.json());
app.use(cors());

app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + "/public"));


app.use("/api/register", register);
app.use("/api/login", login);
app.use("/api/identity", auth, Identity);

app.get("/", (req, res) => {
  res.send("Welcome our Hammi system Api...");
});

const uri = process.env.DB_URI;
const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server running on port: ${port}...`);
});
mongoose

  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connection established..."))
  .catch((error) => console.error("MongoDB connection failed:", error.message));
