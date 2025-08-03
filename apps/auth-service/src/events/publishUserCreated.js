const { producer } = require("../utils/kafkaClient");

async function publishUserCreated(user) {
  await producer.send({
    topic: "user-service-topic",
    messages: [
      {
        value: JSON.stringify({
          type: "user.created",
          data: {
            id: user.id,
            username: user.username,
            email: user.email,
          },
        }),
      },
    ],
  });
}

module.exports = publishUserCreated;