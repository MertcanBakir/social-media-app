const express = require("express");
const upload = require("../utils/cloudinary");
const authMiddleware = require("../middlewares/authMiddleware");
const { generateProfile, getProfile } = require("../controllers/user.controller");
const router = express.Router();

router.post("/upload", upload.single("image"), (req, res) => {
  res.status(200).json({ url: req.file.path });
});

router.post(
  "/profile",
  authMiddleware,
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  generateProfile
);

router.get("/profile/me", authMiddleware, getProfile);



module.exports = router; 