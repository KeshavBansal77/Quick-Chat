const express = require("express");
const {
  getOrCreateAIChat,
  chatWithAI,
  summarizeChat,
} = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/chat-session", protect, getOrCreateAIChat);
router.post("/chat", protect, chatWithAI);
router.post("/summarize", protect, summarizeChat);

module.exports = router;
