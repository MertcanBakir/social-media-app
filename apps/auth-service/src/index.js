const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();
const cookieParser = require("cookie-parser");

const { producer } = require("./utils/kafkaClient");
const authServiceListener = require("./listeners/authServiceListener");
const authRoutes = require("./routes/auth.routes");
const errorHandler = require("/app/packages/errorHandler");

const app = express();

// Middleware'ler
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// Route'lar
app.use("/auth", authRoutes);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 6000;

async function start() {
  try {
    // Kafka bağlantısını başlat
    await producer.connect();
    console.log("✅ Kafka producer bağlı");

    // Kafka consumer listener'ı başlat
    await authServiceListener();
    console.log("✅ Kafka consumer dinleyici aktif");

    // Express sunucusunu başlat
    app.listen(PORT, () => {
      console.log(`✅ Auth service port ${PORT} üzerinden çalışıyor`);
    });

  } catch (error) {
    console.error("❌ Servis başlatılırken hata:", error);
    process.exit(1);
  }
}

start();