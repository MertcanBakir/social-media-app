const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
require("dotenv").config();


const userRoutes = require("./routes/user.routes");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

app.use(morgan("dev")); 
app.use(cors());
app.use(express.json());
app.use(cookieParser());

//ROUTE'LARI AKTİF ET
app.use("/", userRoutes);

app.get("/", (req, res) => {
  res.send("User service is running 🚀");
});

app.use(errorHandler);

const PORT = process.env.PORT || 6001;
app.listen(PORT, () => {
  console.log(`✅ User service running on port ${PORT}`);
});