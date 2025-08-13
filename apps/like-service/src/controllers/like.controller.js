const prisma = require("../utils/prisma");

const createLike = async (req, res, next) => {
  const userId = req.user.userId;
  const { tweetId } = req.body;

  try {
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_tweetId: {
          userId,
          tweetId,
        },
      },
    });

    if (existingLike) {
      return res.status(409).json({
        success: false,
        message: "Like zaten mevcut",
      });
    }

    const like = await prisma.like.create({
      data: {
        userId,
        tweetId,
      },
    });

    res.status(201).json({
      success: true,
      like,
    });
  } catch (err) {
    next(err);
  }
};

const deleteLike = async (req, res, next) => {
  const userId = req.user.userId;
  const { tweetId } = req.body;

  try {
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_tweetId: {
          userId,
          tweetId,
        },
      },
    });

    if (!existingLike) {
      return res.status(404).json({
        success: false,
        message: "Like mevcut değil",
      });
    }

    const like = await prisma.like.delete({
      where: {
        userId_tweetId: {
          userId,
          tweetId,
        },
      },
    });

    res.status(200).json({
      success: true,
      like,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createLike,
  deleteLike,
};