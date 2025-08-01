const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
require("dotenv").config();

const errorHandler = require("./middlewares/errorHandler");
const followRoutes = require("./routes/follow.routes");
const { producer } = require("./utils/kafkaClient");
const followServiceListener = require("./listeners/followServiceListener");

const app = express();

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/", followRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 6003;

async function startServer() {
  try {
    await producer.connect(); 
    console.log("📡 Kafka producer bağlandı.");

    await followServiceListener();
    console.log("👂 Follow service listener aktif.");

    app.listen(PORT, () => {
      console.log(`✅ Follow service running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Başlatma hatası:", err);
    process.exit(1);
  }
}

startServer();