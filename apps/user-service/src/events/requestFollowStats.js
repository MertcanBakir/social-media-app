// apps/user-service/src/events/requestFollowStats.js
const { v4: uuidv4 } = require("uuid");
const { producer } = require("../utils/kafkaClient");
const { addPendingRequest } = require("../utils/pendingRequests");

/**
 * Follow servisinden takipçi/takip edilen sayıları ister.
 * Dönen data şekli: { userId, followersCount, followingCount }
 */
async function requestFollowStats(userId) {
  const correlationId = uuidv4();

  // Cevabı bekleyeceğimiz promise
  const response = new Promise((resolve, reject) => {
    // pendingRequests util’inizde timeout destekliyorsa üçüncü parametre olarak süre de geçebilirsiniz
    addPendingRequest(correlationId, resolve, reject);
  });

  // follow-service-topic’e istek at
  await producer.send({
    topic: "follow-service-topic",
    messages: [
      {
        key: correlationId,
        value: JSON.stringify({
          type: "follow.follownums",
          correlationId,
          data: { id: userId },
        }),
      },
    ],
  });

  return response;
}

module.exports = requestFollowStats;