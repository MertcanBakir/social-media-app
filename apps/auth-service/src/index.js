const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();
const cookieParser = require("cookie-parser");

const { producer, consumer } = require("./utils/kafkaClient");
const authServiceListener = require("./listeners/authServiceListener");
const authRoutes = require("./routes/auth.routes");
const errorHandler = require("/app/packages/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/auth", authRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 6000;

async function waitForKafkaConsumer() {
  let connected = false;
  while (!connected) {
    try {
      await consumer.connect();
      connected = true;
    } catch (err) {
      console.log("⏳ Kafka consumer bekliyor...");
      await new Promise((res) => setTimeout(res, 2000));
    }
  }
}

async function start() {
  try {
    await producer.connect();
    console.log("✅ Kafka producer bağlı");

    await waitForKafkaConsumer();
    console.log("✅ Kafka consumer bağlı");

    await authServiceListener();

    app.listen(PORT, () => {
      console.log(`✅ Auth service running on port ${PORT}`);
    });

  } catch (error) {
    console.error("❌ Servis başlatılırken hata:", error);
    process.exit(1);
  }
}

start();