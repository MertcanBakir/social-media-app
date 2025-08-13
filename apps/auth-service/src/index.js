// apps/auth-service/index.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
require("dotenv").config();

const { producer, consumer } = require("./utils/kafkaClient");
const authServiceListener = require("./listeners/authServiceListener");
const authRoutes = require("./routes/auth.routes");
const errorHandler = require("/app/packages/errorHandler");
const { startRegistryHeartbeat } = require("/app/packages/registry-client.cjs");

const app = express();

// CORS + cookie + body
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
}));
app.use(express.json());
app.use(cookieParser());

// log
app.use(morgan("dev"));

// routes
app.use("/auth", authRoutes);

// global error handler
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

    app.listen(PORT, async () => {
      console.log(`✅ Auth service running on port ${PORT}`);

      // ---- Redis service registry heartbeat ----
      const id = process.env.INSTANCE_ID || crypto.randomUUID();
      const name = process.env.REGISTRY_NAME || "auth-service";
      const address = process.env.REGISTRY_ADDRESS || "http://auth-service";
      const redisUrl = process.env.REGISTRY_REDIS_URL || "redis://redis:6379";

      await startRegistryHeartbeat({
        name,
        id,
        address,
        port: Number(PORT),
        redisUrl,
        ttlSec: Number(process.env.REGISTRY_TTL || 30),
        intervalMs: Number(process.env.REGISTRY_INTERVAL || 10_000),
      });
      console.log("🔁 registry heartbeat başladı (auth-service)");
    });

  } catch (error) {
    console.error("❌ Servis başlatılırken hata:", error);
    process.exit(1);
  }
}

start();