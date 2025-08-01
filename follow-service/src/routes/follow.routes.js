const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const {followUser, unfollowUser,getFollowers, getFollowing, isFollowing} = require("../controllers/follow.controller");



router.post("/follow", authMiddleware, followUser);
router.delete("/unfollow", authMiddleware, unfollowUser);
router.get("/followers", getFollowers);
router.get("/following", getFollowing);
router.get("/is-following", authMiddleware, isFollowing); 


module.exports = router;