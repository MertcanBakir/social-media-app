const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token = req.cookies.token; 
  
  if (!token) {
    return res.status(401).json({ message: "Yetkisiz erişim." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Geçersiz token." });
  }
};

module.exports = authMiddleware;