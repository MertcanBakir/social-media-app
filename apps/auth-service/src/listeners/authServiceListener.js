const { consumer, producer } = require("../utils/kafkaClient");
const prisma = require("../utils/prisma");

async function authServiceListener() {
  await consumer.subscribe({ topic: "auth-service-topic", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const { type, correlationId, data } = JSON.parse(message.value.toString());
        if(type === "auth-user-info-request"){
            const { ids } = data;
            try{
              const users = await prisma.user.findMany({
                where: {
                  id: { in: ids },
                },
                select: {
                  id: true,
                  username: true,
                },
              });

              await producer.send({
                topic: "follow-service-topic",
                messages: [
                  {
                    key: correlationId,
                    value: JSON.stringify({
                      type: "auth-user-info-result",
                      correlationId,
                      data: users,
                    }),
                  },
                ],
              });
              console.log(`📤 auth-user-info-result gönderildi: ${correlationId}`);
            }catch(err){
              console.error("❌ auth-user-info-request işlenirken hata:", err);
            }
        }
        if (type === "auth-user-info-following-request") {
          const { ids } = data;
          try {
            const users = await prisma.user.findMany({
              where: {
                id: { in: ids },
              },
              select: {
                id: true,
                username: true,
              },
            });

            await producer.send({
              topic: "follow-service-topic",
              messages: [
                {
                  key: correlationId,
                  value: JSON.stringify({
                    type: "auth-user-info-following-result",
                    correlationId,
                    data: users,
                  }),
                },
              ],
            });

            console.log(`📤 auth-user-info-following-result gönderildi: ${correlationId}`);
          } catch (err) {
            console.error("❌ auth-user-info-following-request işlenirken hata:", err);
          }
        }

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
        if (type === "tweet.fetchByUsername") {
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
            topic: "tweet-service-topic",
            messages: [
              {
                key: correlationId,
                value: JSON.stringify({
                  type: "tweet.fetched",
                  correlationId,
                  data: user || null,
                }),
              },
            ],
          });

          console.log(`✅ Kullanıcı bulundu ve tweet servisine cevap gönderildi: ${username}`);
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
        if (type === "tweet.usernametoıd") {
          const { username } = data;

          const user = await prisma.user.findUnique({
            where: { username },
            select: {
              id: true,
              username: true,
            },
          });

          await producer.send({
            topic: "tweet-service-topic",
            messages: [
              {
                key: correlationId,
                value: JSON.stringify({
                  type: "tweet.usernametoıd.result",
                  correlationId,
                  data: user || null,
                }),
              },
            ],
          });

          console.log(`📤 tweet.usernametoıd.result yanıtı gönderildi: ${username}`);
        }

      } catch (err) {
        console.error("❌ Kafka mesajı işlenirken hata:", err);
      }
    },
  });
}

module.exports = authServiceListener;