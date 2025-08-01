const prisma = require("../utils/prisma");
const { v4: uuidv4 } = require("uuid");
const { addPendingRequest } = require("../utils/pendingRequests");
const { sendUserInfoRequest, sendFollowingInfoRequest } = require("../events/follow.publish");

const followUser = async (req, res, next) => {
  const followerId = req.user.userId;
  const { userId } = req.body;

  try {
    const existingFollow = await prisma.Follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: userId,
        },
      },
    });

    if (existingFollow) {
      const error = new Error("Zaten takip ediliyor.");
      error.statusCode = 400;
      return next(error);
    }

    const follow = await prisma.Follow.create({
      data: {
        followerId,
        followingId: userId,
      },
    });

    res.status(201).json({ message: "Takip edildi." });
  } catch (err) {
    next(err);
  }
};

const unfollowUser = async (req, res, next) => {
  const followerId = req.user.userId;
  const { userId } = req.body;

  try {
    const existingFollow = await prisma.Follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: userId,
        },
      },
    });

    if (!existingFollow) {
      const error = new Error("Zaten takip edilmiyor.");
      error.statusCode = 400;
      return next(error);
    }

    await prisma.Follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId: userId,
        },
      },
    });

    res.status(200).json({ message: "Takipten çıkıldı." });
  } catch (err) {
    next(err);
  }
};


const getFollowers = async (req, res, next) => {
  const { userId } = req.body;

  try {
    const followers = await prisma.follow.findMany({
      where: {
        followingId: userId,
      },
      select: {
        followerId: true,
      },
    });

    const ids = followers.map((f) => f.followerId);

    if (ids.length === 0) {
      return res.status(200).json({ followers: [] });
    }

    const correlationId = uuidv4();

    const userPromise = new Promise((resolve, reject) => {
      addPendingRequest(correlationId, resolve, reject);
    });

    await sendUserInfoRequest(ids, correlationId);

    const userData = await userPromise;

    res.status(200).json({ followers: userData });
  } catch (err) {
    next(err);
  }
};

const getFollowing = async(req,res,next) => {
  const { userId } = req.body;
  try {
    const followings = await prisma.follow.findMany({
      where: {
        followerId: userId,
      },
      select: {
        followingId: true,
      },
    });

    const ids = followings.map((f) => f.followingId);

    if (ids.length === 0) {
      return res.status(200).json({ followings: [] });
    }

    const correlationId = uuidv4();

    const userPromise = new Promise((resolve, reject) => {
      addPendingRequest(correlationId, resolve, reject);
    });

    await sendFollowingInfoRequest(ids, correlationId);

    const userData = await userPromise;

    res.status(200).json({ followings: userData });
  } catch (err) {
    next(err);
  }

};

const isFollowing = async (req, res, next) => {
  const followerId = req.user.userId;
  const { userId: followingId } = req.body;

  try {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    res.status(200).json({ isFollowing: !!follow });
  } catch (err) {
    next(err);
  }
};

module.exports = {
followUser,
unfollowUser,
getFollowers,
getFollowing,
isFollowing
};