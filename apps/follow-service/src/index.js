// apps/follow-service/index.js
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const crypto = require("crypto");
require("dotenv").config();

const errorHandler = require("/app/packages/errorHandler");
const followRoutes = require("./routes/follow.routes");
const { producer, consumer } = require("./utils/kafkaClient");
const followServiceListener = require("./listeners/followServiceListener");
const { startRegistryHeartbeat } = require("/app/packages/registry-client.cjs");

const app = express();

// CORS + body + cookie
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// routes
app.use("/follow", followRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 6003;

async function waitForKafkaConsumer() {
  let connected = false;
  while (!connected) {
    try {
      await consumer.connect();
      connected = true;
    } catch {
      console.log("⏳ Kafka consumer bekliyor...");
      await new Promise((res) => setTimeout(res, 2000));
    }
  }
}

async function startServer() {
  try {
    await producer.connect();
    console.log("✅ Kafka producer bağlı");

    await waitForKafkaConsumer();
    console.log("✅ Kafka consumer bağlı");

    await followServiceListener();

    app.listen(PORT, async () => {
      console.log(`✅ Follow service running on port ${PORT}`);

      // Registry heartbeat
      const id = process.env.INSTANCE_ID || crypto.randomUUID();
      const name = process.env.REGISTRY_NAME || "follow-service";
      const address = process.env.REGISTRY_ADDRESS || "http://follow-service";
      const redisUrl = process.env.REGISTRY_REDIS_URL || "redis://redis:6379";

      await startRegistryHeartbeat({
        name, id, address, port: Number(PORT),
        redisUrl,
        ttlSec: Number(process.env.REGISTRY_TTL || 30),
        intervalMs: Number(process.env.REGISTRY_INTERVAL || 10_000),
      });
      console.log("🔁 registry heartbeat başladı (follow-service)");
    });
  } catch (err) {
    console.error("❌ Başlatma hatası:", err);
    process.exit(1);
  }
}

startServer();