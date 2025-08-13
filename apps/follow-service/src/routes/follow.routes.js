const express = require("express");
const router = express.Router();
const authMiddleware = require("/app/packages/authMiddleware");
const {followUser, unfollowUser,getFollowers, getFollowing, isFollowing} = require("../controllers/follow.controller");



router.post("/follow", authMiddleware, followUser);
router.delete("/unfollow", authMiddleware, unfollowUser);
router.post("/followers", getFollowers);
router.post("/following", getFollowing);
router.post("/is-following", authMiddleware, isFollowing); 


module.exports = router;