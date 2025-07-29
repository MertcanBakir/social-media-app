const express = require("express");
const cors = require("cors");
require("dotenv").config();
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth.routes"); // 👈 auth route'larını dahil ettik

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Route'ları bağla
app.use("/auth", authRoutes); // 👈 Artık /auth/register aktif!

// Test endpoint
app.get("/", (req, res) => {
  res.send("Auth Service is running 🚀");
});

const PORT = process.env.PORT || 6000;
app.listen(PORT, () => {
  console.log(`✅ Auth service running on port ${PORT}`);
});