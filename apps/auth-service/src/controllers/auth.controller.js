const bcrypt = require("bcrypt");
const prisma = require("../utils/prisma");
const generateToken = require("../utils/generateToken");
const publishUserCreated = require("../events/publishUserCreated");

const register = async (req, res, next) => {
   console.log("💡 prisma.user nedir?", prisma.user);
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Tüm alanlar zorunludur." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        email: true,
        created_at: true,
      },
    });

    await publishUserCreated(user);

    res.status(201).json({ user });
  } catch (err) {
    if (err.code === "P2002") {
      const error = new Error("Kullanıcı zaten var.");
      error.statusCode = 409;
      return next(error);
    }
    next(err);
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email ve şifre zorunludur." });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      const error = new Error("Geçersiz kimlik bilgileri.");
      error.statusCode = 401;
      return next(error);
    }

    const token = generateToken(user.id);

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 gün
      })
      .status(200)
      .json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          created_at: user.created_at,
        },
      });
  } catch (err) {
    next(err);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        username: true,
        email: true,
        created_at: true,
      },
    });

    if (!user) {
      const error = new Error("Kullanıcı bulunamadı.");
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(200).json({ message: "Çıkış yapıldı." });
};

const changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.userId;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Tüm alanlar zorunludur." });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      const error = new Error("Kullanıcı bulunamadı.");
      error.statusCode = 404;
      return next(error);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      const error = new Error("Geçerli şifre hatalı.");
      error.statusCode = 401;
      return next(error);
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    res.status(200).json({ message: "Şifre başarıyla güncellendi." });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  me,
  logout,
  changePassword,
};