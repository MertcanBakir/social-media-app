const prisma = require("../utils/prisma");
const cloudinary = require("cloudinary").v2;
const requestUserByUsername = require("../events/requestUserByUsername");
const requestFollowingIds = require("../events/requestFollowingIds");
const requestLikeCounts = require("../events/requestLikeCounts");
const sendTweetDeletion = require("../events/sendTweetDeletion");

const getLikeCounts = async (tweets) => {
  const tweetIds = tweets.map(tweet => tweet.id);
  return await requestLikeCounts(tweetIds);
};

const attachLikeCounts = async (tweets) => {
  const likeCounts = await getLikeCounts(tweets);
  return tweets.map(tweet => ({
    ...tweet,
    likeCount: likeCounts[tweet.id] || 0
  }));
};

const getCloudinaryPublicId = (mediaUrl) => {
  const url = decodeURIComponent(mediaUrl); // %20 gibi karakterleri çözer
  const parts = url.split("/upload/");
  if (parts.length < 2) return null;

  const path = parts[1]; 
  const pathWithoutVersion = path.split("/").slice(1).join("/"); 

  const extensionIndex = pathWithoutVersion.lastIndexOf(".");
  return extensionIndex !== -1
    ? pathWithoutVersion.slice(0, extensionIndex)
    : pathWithoutVersion;
};

const createTweet = async (req, res, next) => {
  try {
    const { content } = req.body;
    const authorId = req.user?.userId;

    if (!authorId) {
      return res.status(401).json({ message: "Author kimliği alınamadı." });
    }

    if (!content && !req.file) {
      return res.status(400).json({ error: "İçerik veya medya dosyası sağlanmalıdır." });
    }

    let mediaUrl = null;
    let mediaType = null;
    let cloudinaryPublicId = null;

    if (req.file) {
      mediaUrl = req.file.path;
      const mime = req.file.mimetype;

      if (mime.startsWith("image")) {
        mediaType = "image";
      } else if (mime.startsWith("video")) {
        mediaType = "video";
      } else {
        return res.status(400).json({ error: "Desteklenmeyen medya türü." });
      }

      cloudinaryPublicId = getCloudinaryPublicId(mediaUrl);
    }

    let tweet;

    try {
      tweet = await prisma.tweet.create({
        data: {
          content,
          mediaUrl,
          mediaType,
          authorId,
        },
      });
    } catch (dbError) {
      if (cloudinaryPublicId) {
        await cloudinary.uploader.destroy(cloudinaryPublicId, {
          resource_type: mediaType === "video" ? "video" : "image",
        });
      }
      throw dbError;
    }

    return res.status(201).json(tweet);
  } catch (err) {
    next(err);
  }
};

const getTweets = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1; 
    const pageSize = 10;

    const skip = (page - 1) * pageSize;

    const [tweets, count] = await Promise.all([
      prisma.tweet.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.tweet.count(),
    ]);

    const tweetsWithLikes = await attachLikeCounts(tweets);

    return res.status(200).json({
      tweets: tweetsWithLikes,
      totalCount: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
    });
  } catch (err) {
    next(err);
  }
};

const getFollowingTweet = async (req, res, next) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Kullanıcı kimliği alınamadı." });
    }

    // Kafka ile follow-service üzerinden takip edilen kullanıcıların ID'lerini al
    const followingIds = await requestFollowingIds(userId); // örn: ['id1', 'id2', 'id3']

    if (!followingIds || followingIds.length === 0) {
      return res.status(200).json({
        tweets: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: 1,
        hasMore: false,
      });
    }

    // Sayfalama bilgisi
    const page = parseInt(req.query.page) || 1;
    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    // Takip edilenlerin tweetlerini getir
    const [tweets, count] = await Promise.all([
      prisma.tweet.findMany({
        where: {
          authorId: {
            in: followingIds,
          },
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.tweet.count({
        where: {
          authorId: {
            in: followingIds,
          },
        },
      }),
    ]);

    const tweetsWithLikes = await attachLikeCounts(tweets);
    const totalPages = Math.ceil(count / pageSize);
    const hasMore = page < totalPages;

    return res.status(200).json({
      tweets: tweetsWithLikes,
      totalCount: count,
      totalPages,
      currentPage: page,
      hasMore,
    });
  } catch (err) {
    next(err);
  }
};

const getUserTweet = async (req, res, next) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Kullanıcı adı (username) gereklidir." });
    }

    const user = await requestUserByUsername(username);

    if (!user) {
      return res.status(404).json({ error: "Kullanıcı bulunamadı." });
    }

    const authorId = user.id;

    const page = parseInt(req.query.page) || 1;
    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    const [tweets, count] = await Promise.all([
      prisma.tweet.findMany({
        where: { authorId },
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.tweet.count({
        where: { authorId },
      }),
    ]);

    // 🔁 Like count'ları topla ve birleştir
    const likeCounts = await requestLikeCounts(tweets.map(t => t.id));
    const tweetsWithLikes = tweets.map(tweet => ({
      ...tweet,
      likeCount: likeCounts[tweet.id] || 0
    }));

    console.log("🔢 Like counts:", likeCounts); // ✅ artık tanımlı

    return res.status(200).json({
      tweets: tweetsWithLikes,
      totalCount: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: page,
    });
  } catch (err) {
    next(err);
  }
};

const getMyTweet = async (req, res, next) => {
  const authorId = req.user?.userId;
  if (!authorId) {
    return res.status(401).json({ message: "Author kimliği alınamadı." });
  }

  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    const [tweets, count] = await Promise.all([
      prisma.tweet.findMany({
        where: { authorId },
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.tweet.count({ where: { authorId } }),
    ]);

    const tweetsWithLikes = await attachLikeCounts(tweets);
    const totalPages = Math.ceil(count / pageSize);
    const hasMore = page < totalPages;

    return res.status(200).json({
      tweets: tweetsWithLikes,
      totalCount: count,
      totalPages,
      currentPage: page,
      hasMore,
    });
  } catch (err) {
    next(err);
  }
};


const deleteTweet = async (req, res, next) => {
  try {
    const authorId = req.user?.userId;
    const tweetId = req.body.tweetId;

    if (!authorId) {
      return res.status(401).json({ message: "Author kimliği alınamadı." });
    }

    const tweet = await prisma.tweet.findUnique({
      where: { id: tweetId },
    });

    if (!tweet) {
      return res.status(404).json({ error: "Tweet bulunamadı." });
    }

    if (tweet.authorId !== authorId) {
      return res.status(403).json({ error: "Bu tweet'i silme yetkiniz yok." });
    }

    // ✅ Cloudinary medyasını sil
    if (tweet.mediaUrl) {
      const cloudinaryPublicId = getCloudinaryPublicId(tweet.mediaUrl);

      if (cloudinaryPublicId) {
        await cloudinary.uploader.destroy(cloudinaryPublicId, {
          resource_type: tweet.mediaType === "video" ? "video" : "image",
        });
      }
    }

    await prisma.tweet.delete({
      where: { id: tweetId },
    });

   sendTweetDeletion(tweetId);

    return res.status(200).json({ message: "Tweet başarıyla silindi." });
  } catch (err) {
    next(err);
  }
};

module.exports = {
    createTweet,
    getTweets,
    getFollowingTweet,
    getUserTweet,
    deleteTweet,
    getMyTweet
};
