const { producer } = require("../utils/kafkaClient");
const { v4: uuidv4 } = require("uuid");
const { addPendingRequest } = require("../utils/pendingRequests");

const requestLikeCounts = async (tweetIds) => {
  const correlationId = uuidv4();

  return new Promise(async (resolve, reject) => {
    addPendingRequest(correlationId, resolve, reject);

    await producer.send({
      topic: "like-service-topic",
      messages: [
        {
          value: JSON.stringify({
            type: "tweet.followingIds",
            correlationId,
            data: { tweetIds },
          }),
        },
      ],
    });
  });
};

module.exports = requestLikeCounts;



