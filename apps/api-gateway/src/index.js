const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { createProxyMiddleware } = require("http-proxy-middleware");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(morgan("dev"));


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // Her IP için 100 istek
  message: "🚫 Çok fazla istek attınız. Lütfen sonra tekrar deneyin.",
  standardHeaders: true, 
  legacyHeaders: false,
});
app.use(limiter); 

app.use("/user", createProxyMiddleware({
  target: "http://user-service:6001",
  changeOrigin: true,
}));

app.use("/tweet", createProxyMiddleware({
  target: "http://tweet-service:6002",
  changeOrigin: true,
}));

app.use("/auth", createProxyMiddleware({
  target: "http://auth-service:6000",
  changeOrigin: true,
}));

app.use("/follow", createProxyMiddleware({
  target: "http://follow-service:6003",
  changeOrigin: true,
}));

app.use("/like", createProxyMiddleware({
  target: "http://like-service:6004",
  changeOrigin: true,
}));

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`🚪 API Gateway çalışıyor: http://localhost:${PORT}`);
});