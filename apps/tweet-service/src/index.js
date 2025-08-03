const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
require("dotenv").config();
const { producer } = require("./utils/kafkaClient");
const tweetRoutes = require("./routes/tweet.routes");
const errorHandler = require("/app/packages/errorHandler");
const tweetServiceListener = require("./listeners/tweetServiceListener");

const app = express();

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/tweet", tweetRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 6002;

async function startServer() {
  try {
    await producer.connect();
    console.log("✅ Kafka producer bağlı");

    await tweetServiceListener();

    app.listen(PORT, () => {
      console.log(`✅ Tweet service running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Sunucu başlatılamadı:", err);
    process.exit(1);
  }
}

startServer();