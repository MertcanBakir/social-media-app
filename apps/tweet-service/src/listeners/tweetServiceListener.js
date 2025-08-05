const { consumer } = require("../utils/kafkaClient");
const prisma = require("../utils/prisma");
const { resolvePendingRequest } = require("../utils/pendingRequests"); 

async function tweetServiceListener() {
  await consumer.subscribe({ topic: "tweet-service-topic", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const { type, data, correlationId } = JSON.parse(message.value.toString());
      if (type === "tweet.fetched" && correlationId) {
        resolvePendingRequest(correlationId, data);
        console.log(`📨 tweet.fetched alındı ve yanıt çözüldü: ${correlationId}`);
      }
      if (type === "tweet.followingIds.result" && correlationId) {
        resolvePendingRequest(correlationId, data); 
        console.log(`📨 tweet.followingIds.result alındı ve çözüldü: ${correlationId}`);
      }
      if (type === "tweet.likeCounts.result" && correlationId) {
        resolvePendingRequest(correlationId, data);
      }
      if (type === "tweet.likeCounts.error" && correlationId) {
        console.error(`❌ Like count alınamadı: ${data?.error || "Bilinmeyen hata"}`);
        resolvePendingRequest(correlationId, { error: data?.error || "Like sayısı alınamadı" });
      }
      if (type === "tweet.usernametoıd.result" && correlationId) {
        resolvePendingRequest(correlationId, data);
        console.log(`📨 tweet.usernametoıd.result alındı ve çözüldü: ${correlationId}`);
      }


    },
  });
}

module.exports = tweetServiceListener;