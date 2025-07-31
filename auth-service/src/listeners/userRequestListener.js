const { consumer, producer } = require("../utils/kafkaClient");
const prisma = require("../utils/prisma");

async function startUserRequestListener() {
  await consumer.subscribe({ topic: "auth-service-topic", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const { type, correlationId, data } = JSON.parse(message.value.toString());

        // 👉 Username'e göre kullanıcı getir
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

        // 🔍 Username arama sorgusu
        if (type === "user.searchByUsername") {
          const { query } = data;

          const startsWithMatches = await prisma.user.findMany({
            where: {
              username: {
                startsWith: query,
                mode: "insensitive",
              },
            },
            select: {
              username: true,
            },
            take: 10,
          });

          const containsMatches = await prisma.user.findMany({
            where: {
              username: {
                contains: query,
                mode: "insensitive",
              },
            },
            select: {
              username: true,
            },
            take: 10,
          });

          const merged = [
            ...startsWithMatches,
            ...containsMatches.filter(
              (item) => !startsWithMatches.find((start) => start.username === item.username)
            ),
          ].slice(0, 10);

          await producer.send({
            topic: "user-service-topic",
            messages: [
              {
                key: correlationId,
                value: JSON.stringify({
                  type: "user.searched",
                  correlationId,
                  data: merged,
                }),
              },
            ],
          });

          console.log(`🔍 Arama sonucu gönderildi: "${query}"`);
        }

      } catch (err) {
        console.error("❌ Kafka mesajı işlenirken hata:", err);
      }
    },
  });
}

module.exports = startUserRequestListener;