const { consumer } = require("../utils/kafkaClient");
const prisma = require("../utils/prisma");
const { resolvePendingRequest } = require("../utils/pendingRequests"); 

async function tweetServiceListener() {
  await consumer.connect();
  await consumer.subscribe({ topic: "tweet-service-topic", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const { type, data, correlationId } = JSON.parse(message.value.toString());


    },
  });
}

module.exports = tweetServiceListener;