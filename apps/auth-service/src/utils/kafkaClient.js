const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "social-app",
  brokers:[process.env.KAFKA_BROKER || "kafka:9092"],
});

const consumer = kafka.consumer({ groupId: "auth-service-group" });
const producer = kafka.producer();

module.exports = {
  kafka,
  consumer,
  producer,
};