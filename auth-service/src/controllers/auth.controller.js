const bcrypt = require("bcrypt");
const prisma = require("../utils/prisma");
const generateToken = require("../utils/generateToken");

const register = async (req, res) => {
  const { username, email, password } = req.body;
  console.log("Register isteği alındı:", { username, email });

  if (!username || !email || !password) {
    console.warn("Eksik alanlar:", { username, email, password });
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

    console.log("Kullanıcı başarıyla oluşturuldu:", user);
    res.status(201).json({ user });
  } catch (error) {
    console.error("Kayıt hatası:", error);
    if (error.code === "P2002") {
      console.warn("Benzersiz alan çakışması: email veya username zaten var.");
      return res.status(409).json({ message: "Kullanıcı zaten var." });
    }
    res.status(500).json({ message: "Bir hata oluştu." });
  }
};


const login = async (req, res) => {
  const { email, password } = req.body;
  console.log("Giriş denemesi:", { email });

  if (!email || !password) {
    return res.status(400).json({ message: "Email ve şifre zorunludur." });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.warn("Kullanıcı bulunamadı");
      return res.status(401).json({ message: "Geçersiz kimlik bilgileri." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.warn("Şifre yanlış");
      return res.status(401).json({ message: "Geçersiz kimlik bilgileri." });
    }

    const token = generateToken(user.id);
    console.log("Giriş başarılı, token üretildi");

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
  } catch (error) {
    console.error("Giriş hatası:", error);
    res.status(500).json({ message: "Bir hata oluştu." });
  }
};

const me = async (req, res) => {
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
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error("Kullanıcı bilgisi alınamadı:", err);
    res.status(500).json({ message: "Bir hata oluştu." });
  }
};

const logout = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  console.log("Kullanıcı çıkış yaptı");
  res.status(200).json({ message: "Çıkış yapıldı." });
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.userId;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Tüm alanlar zorunludur." });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Geçerli şifre hatalı." });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    console.log("Şifre başarıyla değiştirildi:", user.email);
    res.status(200).json({ message: "Şifre başarıyla güncellendi." });
  } catch (err) {
    console.error("Şifre değiştirme hatası:", err);
    res.status(500).json({ message: "Bir hata oluştu." });
  }
};

module.exports = {
  register,
  login,
  me,
  logout,
  changePassword
};