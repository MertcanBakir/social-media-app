const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
require("dotenv").config();

const errorHandler = require("/app/packages/errorHandler");
const followRoutes = require("./routes/follow.routes");
const { producer, consumer } = require("./utils/kafkaClient");
const followServiceListener = require("./listeners/followServiceListener");

const app = express();

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/", followRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 6003;

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

async function startServer() {
  try {
    await producer.connect(); 
    console.log("📡 Kafka producer bağlandı.");

    await waitForKafkaConsumer();
    console.log("✅ Kafka consumer bağlı");

    await followServiceListener();

    app.listen(PORT, () => {
      console.log(`✅ Follow service running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Başlatma hatası:", err);
    process.exit(1);
  }
}

startServer();