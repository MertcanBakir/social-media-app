const { consumer, producer } = require("../utils/kafkaClient");
const prisma = require("../utils/prisma");
const { resolvePendingRequest } = require("../utils/pendingRequests");

const likeServiceListener = async () => {
  await consumer.subscribe({ topic: "like-service-topic", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const { type, data, correlationId } = JSON.parse(message.value.toString());

      if (type === "tweet.followingIds") {
        const tweetIds = data.tweetIds;

        try {
          const likeCounts = await prisma.like.groupBy({
            by: ["tweetId"],
            _count: true,
            where: {
              tweetId: { in: tweetIds }
            }
          });

          const result = likeCounts.reduce((acc, item) => {
            acc[item.tweetId] = item._count;
            return acc;
          }, {});

          await producer.send({
            topic: "tweet-service-topic",
            messages: [
              {
                value: JSON.stringify({
                  type: "tweet.likeCounts.result",
                  correlationId,
                  data: result
                })
              }
            ]
          });
        } catch (err) {
          console.error("❌ Like sayısı alınırken hata:", err);
          await producer.send({
            topic: "tweet-service-topic",
            messages: [
              {
                value: JSON.stringify({
                  type: "tweet.likeCounts.error",
                  correlationId,
                  error: err.message
                })
              }
            ]
          });
        }
      }
      if (type === "tweet.delete") {
        const { tweetId } = data;

        try {
          const deleted = await prisma.like.deleteMany({
            where: { tweetId }
          });

          console.log(`🗑️ ${deleted.count} like silindi → tweetId: ${tweetId}`);

        } catch (err) {
          console.error("❌ Like silinirken hata:", err);
        }
      }
    }
  });
};

module.exports = likeServiceListener;