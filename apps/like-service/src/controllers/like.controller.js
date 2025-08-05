const prisma = require("../utils/prisma");


const createLike = async (req,res,next) => {
    const userId = req.user.userId;
    const { tweetId } = req.body;

    try {
        const existingLike = await prisma.like.findUnique({
        where: {
             userId_tweetId: {
                userId,
                tweetId
                }
            }
        });
        if(existingLike){
            const error = new Error("Like zaten mevcut");
            return next(error);
        }

        const like = await prisma.like.create({
            data:{
                userId,
                tweetId
            },
        });

        res.status(201).json({like});
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
                    tweetId
                }
            }
        });

        if (!existingLike) {
            const error = new Error("Like mevcut degil");
            return next(error);
        }

        const like = await prisma.like.delete({
            where: {
                userId_tweetId: {
                    userId,
                    tweetId
                }
            }
        });

        res.status(200).json({ like });

    } catch (err) {
        next(err);
    }
};

const getTweetLike = async (req,res,next) => {
    const userId = req.user.userId;
}

module.exports = {
    createLike,
    deleteLike
}