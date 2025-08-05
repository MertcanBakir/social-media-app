const express = require("express");
const authMiddleware = require("/app/packages/authMiddleware");
const {createLike, deleteLike} = require("../controllers/like.controller");
const router = express.Router();

router.post("/create", authMiddleware, createLike);
router.delete("/delete", authMiddleware, deleteLike);

module.exports = router;