const { producer } = require("../utils/kafkaClient");

const sendTweetDeletion = async (tweetId) => {
  try {
    await producer.send({
      topic: "like-service-topic",
      messages: [
        {
          value: JSON.stringify({
            type: "tweet.delete",
            data: { tweetId },
          }),
        },
      ],
    });

    console.log(`📤 Like servisine silme mesajı gönderildi → tweetId: ${tweetId}`);
  } catch (err) {
    console.error("❌ Like servisine silme mesajı gönderilemedi:", err);
  }
};

module.exports = sendTweetDeletion;