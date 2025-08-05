const { consumer } = require("../utils/kafkaClient");
const prisma = require("../utils/prisma");
const { resolvePendingRequest } = require("../utils/pendingRequests"); 

async function userServiceListener() {
  await consumer.subscribe({ topic: "user-service-topic", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      const { type, data, correlationId } = JSON.parse(message.value.toString());

      if (type === "user.created") {
        const { id: userId } = data;

        try {
          await prisma.userProfile.create({
            data: {
              userId,
              bio: "",
              profileImage: null,
              coverImage: null,
              location: "",
            },
          });

          console.log(`🟢 Profil oluşturuldu: ${userId}`);
        } catch (err) {
          if (err.code === "P2002") {
            console.warn(`⚠️ Profil zaten var: ${userId}`);
          } else {
            console.error("❌ Profil oluşturulurken hata:", err);
          }
        }
      }
      if (type === "user.fetched" && correlationId) {
        resolvePendingRequest(correlationId, data);
        console.log(`📨 user.fetched alındı ve yanıt çözüldü: ${correlationId}`);
      }
      if (type === "user.searched" && correlationId) {
        resolvePendingRequest(correlationId, data);
        console.log(`📨 Arama sonucu geldi: ${correlationId}`);
      }
      if (type === "follow.follownums.result" && correlationId) {
        resolvePendingRequest(correlationId, data);
        console.log(`📨 Takip verisi alındı: ${correlationId}`);
      }
    },
  });
}

module.exports = userServiceListener;