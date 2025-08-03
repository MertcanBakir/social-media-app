const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "social-app",
  brokers: [process.env.KAFKA_BROKER],
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "tweet-service-group" });

module.exports = {
  kafka,
  producer,
  consumer,
};