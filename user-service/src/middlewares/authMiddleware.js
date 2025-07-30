const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Token gerekli." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId }; // token payload'dan alıyoruz
    next();
  } catch (err) {
    console.error("Token doğrulama hatası:", err);
    return res.status(403).json({ message: "Geçersiz token." });
  }
};

module.exports = authMiddleware;