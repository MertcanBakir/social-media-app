const { consumer, producer } = require("../utils/kafkaClient");
const prisma = require("../utils/prisma");

async function startUserRequestListener() {
  await consumer.subscribe({ topic: "auth-service-topic", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const { type, correlationId, data } = JSON.parse(message.value.toString());

        if (type === "user.fetchByUsername") {
          const { username } = data;

          const user = await prisma.user.findUnique({
            where: { username },
            select: {
              id: true,
              username: true,
              email: true,
              created_at: true,
            },
          });

          await producer.send({
            topic: "user-service-topic",
            messages: [
              {
                key: correlationId,
                value: JSON.stringify({
                  type: "user.fetched",
                  correlationId,
                  data: user || null,
                }),
              },
            ],
          });

          console.log(`✅ Kullanıcı bulundu ve cevap gönderildi: ${username}`);
        }
      } catch (err) {
        console.error("❌ Kafka mesajı işlenirken hata:", err);
      }
    },
  });
}

module.exports = startUserRequestListener;