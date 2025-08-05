const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
require("dotenv").config();
const { producer, consumer } = require("./utils/kafkaClient");
const likeRoutes = require("./routes/like.routes");
const errorHandler = require("/app/packages/errorHandler");
const likeServiceListener = require("./listeners/likeServiceListener")

const app = express();

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/like", likeRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 6004

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

async function startServer(){
    try {
        await producer.connect();
        console.log("✅ Kafka producer bağlı");

        await waitForKafkaConsumer();
        console.log("✅ Kafka consumer bağlı");

        await likeServiceListener();

        app.listen(PORT, () => {
        console.log(`✅ Like service running on port ${PORT}`);
        });        
            
    } catch (err) {
        console.error("❌ Sunucu başlatılamadı:", err);
        process.exit(1);        
    }
}

startServer();