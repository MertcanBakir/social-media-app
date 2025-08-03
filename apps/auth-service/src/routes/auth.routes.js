const express = require("express");
const router = express.Router();
const { register, login, me, logout, changePassword } = require("../controllers/auth.controller");
const authMiddleware = require("/app/packages/authMiddleware");

router.get("/me", authMiddleware, me);

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.put("/change-password", authMiddleware, changePassword);

module.exports = router;