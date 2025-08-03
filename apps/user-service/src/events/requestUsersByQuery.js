const { producer } = require("../utils/kafkaClient");
const { v4: uuidv4 } = require("uuid");
const { addPendingRequest } = require("../utils/pendingRequests");

async function requestUsersByQuery(query) {
  const correlationId = uuidv4();

  return new Promise(async (resolve, reject) => {
    addPendingRequest(correlationId, resolve, reject);

    await producer.send({
      topic: "auth-service-topic",
      messages: [
        {
          value: JSON.stringify({
            type: "user.searchByUsername",
            correlationId,
            data: { query },
          }),
        },
      ],
    });
  });
}

module.exports = requestUsersByQuery;