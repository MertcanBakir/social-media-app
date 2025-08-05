const { producer } = require("../utils/kafkaClient");
const { v4: uuidv4 } = require("uuid");
const { addPendingRequest } = require("../utils/pendingRequests");

async function requestUserByUsername(username) {
  const correlationId = uuidv4();

  return new Promise(async (resolve, reject) => {
    addPendingRequest(correlationId, resolve, reject);

    await producer.send({
      topic: "follow-service-topic",
      messages: [
        {
          value: JSON.stringify({
            type: "tweet.followers",
            correlationId,
            data: { username },
          }),
        },
      ],
    });
  });
}

module.exports = requestUserByUsername;