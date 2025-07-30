const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth.routes");
const errorHandler = require("./middlewares/errorHandler"); 

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use(morgan("dev"));
// Route'ları bağla
app.use("/auth", authRoutes); // /auth/register 


app.use(errorHandler);

const PORT = process.env.PORT || 6000;
app.listen(PORT, () => {
  console.log(`✅ Auth service running on port ${PORT}`);
});