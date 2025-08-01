const { producer } = require("../utils/kafkaClient");

const sendUserInfoRequest = async (userIds, correlationId) => {
  await producer.send({
    topic: "auth-service-topic",
    messages: [
      {
        key: correlationId,
        value: JSON.stringify({
          type: "auth-user-info-request",
          correlationId,
          data: { ids: userIds },
        }),
      },
    ],
  });

  console.log(`📤 auth-service username request for followers : ${correlationId}`);
};

const sendFollowingInfoRequest = async (userIds, correlationId) => {
  await producer.send({
    topic: "auth-service-topic",
    messages: [
      {
        key: correlationId,
        value: JSON.stringify({
          type: "auth-user-info-following-request",
          correlationId,
          data: { ids: userIds },
        }),
      },
    ],
  });

  console.log(`📤 auth-service username request for followings : ${correlationId}`);
};

module.exports = {
  sendUserInfoRequest,
  sendFollowingInfoRequest
};