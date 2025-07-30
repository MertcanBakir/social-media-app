const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Sunucu hatası";

  res.status(statusCode).json({ message });
};

module.exports = errorHandler;