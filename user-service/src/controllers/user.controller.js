const prisma = require("../utils/prisma");

const generateProfile = async (req, res, next) => {
  const { bio, location } = req.body;
  const userId = req.user.userId;

  try {
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      const error = new Error("Profil zaten mevcut.");
      error.statusCode = 400;
      return next(error);
    }

    const profileImage = req.files?.profileImage?.[0]?.path || null;
    const coverImage = req.files?.coverImage?.[0]?.path || null;

    const profile = await prisma.userProfile.create({
      data: {
        userId,
        bio,
        location,
        profileImage,
        coverImage,
      },
    });

    res.status(201).json({ profile });
  } catch (err) {
    next(err);
  }
};

const changeProfile = async(req,res,next) => {
  const userId = req.user.userId;
  const {bio, location} = req.body;
  try{
     const existingProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      const error = new Error("Profil bulunamadı.");
      error.statusCode = 404;
      return next(error);
    }

    const profileImage = req.files?.profileImage?.[0]?.path;
    const coverImage = req.files?.coverImage?.[0]?.path;

    const updatedProfile = await prisma.userProfile.update({
      where: { userId },
      data: {
        bio: bio !== undefined ? bio : existingProfile.bio,
        location: location !== undefined ? location : existingProfile.location,
        profileImage: profileImage || existingProfile.profileImage,
        coverImage: coverImage || existingProfile.coverImage,
      },
    });

    res.status(200).json({ profile: updatedProfile });
  }catch(err){
    next(err);
  }
}

const getProfile = async (req, res, next) => {
  const userId = req.user.userId;

  try {
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      const error = new Error("Profil bulunamadı.");
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({ profile: existingProfile });
  } catch (err) {
    next(err);
  }
};

const getDiffProfile = async (req, res, next) => {
  const { username } = req.params;

  try {
    const profile = await prisma.userProfile.findFirst({
      where: {
        user: {
          username: username,
        },
      },
      include: {
        user: {
          select: {
            username: true,
            email: true,
            created_at: true,
          },
        },
      },
    });

    if (!profile) {
      const error = new Error("Profil bulunamadı.");
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({ profile });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  generateProfile,
  getProfile,
  changeProfile
};