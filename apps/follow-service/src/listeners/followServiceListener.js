const { consumer, producer } = require("../utils/kafkaClient");
const prisma = require("../utils/prisma");
const { resolvePendingRequest } = require("../utils/pendingRequests");

async function followServiceListener() {
  await consumer.subscribe({ topic: "follow-service-topic", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const { type, data, correlationId } = JSON.parse(message.value.toString());

      if (type === "follow.follownums" && correlationId) {
        const { id: userId } = data;

        try {
          const followersCount = await prisma.follow.count({
            where: { followingId: userId },
          });

          const followingCount = await prisma.follow.count({
            where: { followerId: userId },
          });

          await producer.send({
            topic: "user-service-topic",
            messages: [
              {
                key: correlationId,
                value: JSON.stringify({
                  type: "follow.follownums.result",
                  correlationId,
                  data: {
                    userId,
                    followersCount,
                    followingCount,
                  },
                }),
              },
            ],
          });

          console.log(`📨 Takip bilgisi gönderildi: ${userId}`);
        } catch (err) {
          console.error("❌ Takip bilgisi alınırken hata:", err);
        }
      }
      if (type === "auth-user-info-result" && correlationId) {
        resolvePendingRequest(correlationId, data); // data: [{ id, username }, ...]
        console.log(`📥 auth-user-info-request alındı: ${correlationId}`);
      }
      if (type === "auth-user-info-following-result" && correlationId) {
        resolvePendingRequest(correlationId, data); // data: [{ id, username }, ...]
        console.log(`📥 auth-user-info-following-result alındı: ${correlationId}`);
      }
      if (type === "tweet.followingIds" && correlationId) {
        const { userId } = data;

        try {
          const following = await prisma.follow.findMany({
            where: { followerId: userId },
            select: { followingId: true },
          });

          const followingIds = following.map(f => f.followingId);

          await producer.send({
            topic: "tweet-service-topic",
            messages: [
              {
                key: correlationId,
                value: JSON.stringify({
                  type: "tweet.followingIds.result",
                  correlationId,
                  data: followingIds,
                }),
              },
            ],
          });

          console.log(`📨 followingIds gönderildi: ${userId}`);
        } catch (err) {
          console.error("❌ followingIds alınırken hata:", err);
        }
      }
      if (type === "tweet.followingids" && correlationId) {
        const { userId } = data;

        try {
          const following = await prisma.follow.findMany({
            where: { followerId: userId },
            select: { followingId: true },
          });

          const followingIds = following.map(f => f.followingId);

          await producer.send({
            topic: "tweet-service-topic",
            messages: [
              {
                key: correlationId,
                value: JSON.stringify({
                  type: "tweet.followingids.result",
                  correlationId,
                  data: followingIds,
                }),
              },
            ],
          });

          console.log(`📨 followingIds gönderildi: ${userId}`);
        } catch (err) {
          console.error("❌ followingIds alınırken hata:", err);
        }
      }
    },
  });
}

module.exports = followServiceListener;