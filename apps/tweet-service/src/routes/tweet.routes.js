const express = require("express");
const authMiddleware = require("/app/packages/authMiddleware");
const {createTweet, getTweets, getFollowingTweet,getUserTweet , deleteTweet, getMyTweet} = require("../controllers/tweet.controller");
const upload = require("../utils/cloudinary");
const router = express.Router();

router.post("/create", authMiddleware, upload.single("file"), createTweet);
router.get("/tweet", getTweets);
router.get("/following", authMiddleware, getFollowingTweet);
router.get("/my", authMiddleware, getMyTweet);
router.get("/username", getUserTweet);
router.delete("/delete", authMiddleware, deleteTweet);



module.exports = router; 