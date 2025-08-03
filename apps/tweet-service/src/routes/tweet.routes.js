const express = require("express");
const authMiddleware = require("/app/packages/authMiddleware");
const {createPostwVideo, createPostwImage, createTweet } = require("../controllers/tweet.controller");
const router = express.Router();



router.post("/create/video", authMiddleware, createPostwVideo);
router.post("/create/image", authMiddleware, createPostwImage);
router.post("/create/tweet", authMiddleware, createTweet);



module.exports = router; 