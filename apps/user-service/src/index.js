const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
require("dotenv").config();

const { producer } = require("./utils/kafkaClient");
const userRoutes = require("./routes/user.routes");
const errorHandler = require("/app/packages/errorHandler");
const userServiceListener = require("./listeners/userServiceListener");
const app = express();

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/", userRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 6001;

async function startServer() {
  try {
    await producer.connect();
    console.log("✅ Kafka producer bağlı");

    await userServiceListener(); //  Tüm listener mantığı burada

    app.listen(PORT, () => {
      console.log(`✅ User service running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Sunucu başlatılamadı:", err);
    process.exit(1);
  }
}

startServer();