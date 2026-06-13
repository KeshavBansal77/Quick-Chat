const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");
const aiService = require("../services/aiService");

// AI Bot user ID - we'll create this user on first request
const AI_BOT_EMAIL = "ai-bot@e-talk.internal";

// Get or create the AI bot user
const getAIBotUser = async () => {
  let bot = await User.findOne({ email: AI_BOT_EMAIL });
  if (!bot) {
    bot = await User.create({
      name: "Quick Chat AI",
      email: AI_BOT_EMAIL,
      password: "DISABLED_NO_LOGIN_" + Date.now(),
      contact: 0,
      pic: "https://cdn-icons-png.flaticon.com/512/4712/4712109.png",
      about: "I'm Quick Chat's AI Assistant. Ask me anything!",
      is_verified: true,
    });
  }
  return bot;
};

// Get or create AI chat session for a user
const getOrCreateAIChat = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const bot = await getAIBotUser();

  // Find existing AI chat(s) - handle duplicates
  const aiChats = await Chat.find({
    isAIChat: true,
    users: { $all: [userId, bot._id] },
  })
    .populate("users", "-password")
    .populate("latestMessage")
    .sort({ updatedAt: -1 });

  if (aiChats.length > 1) {
    // Delete duplicates, keep the most recent one
    for (let i = 1; i < aiChats.length; i++) {
      await Message.deleteMany({ chat: aiChats[i]._id });
      await Chat.findByIdAndDelete(aiChats[i]._id);
    }
  }

  if (aiChats.length > 0) {
    return res.status(200).json(aiChats[0]);
  }

  // Create new AI chat
  const aiChat = await Chat.create({
    chatName: "Quick Chat AI",
    isGroupChat: false,
    isAIChat: true,
    users: [userId, bot._id],
  });

  const fullChat = await Chat.findById(aiChat._id).populate(
    "users",
    "-password"
  );

  res.status(201).json(fullChat);
});

// Send message to AI and get response
const chatWithAI = asyncHandler(async (req, res) => {
  const { message, chatId } = req.body;
  const userId = req.user._id;

  if (!message || message.trim() === "") {
    res.status(400);
    throw new Error("Message is required");
  }

  const bot = await getAIBotUser();

  // Resolve chat
  let chat;
  if (chatId) {
    chat = await Chat.findById(chatId);
    if (!chat || !chat.isAIChat) {
      res.status(400);
      throw new Error("Invalid AI chat");
    }
  } else {
    // Find or create
    chat = await Chat.findOne({
      isAIChat: true,
      users: { $all: [userId, bot._id] },
    });
    if (!chat) {
      chat = await Chat.create({
        chatName: "Quick Chat AI",
        isGroupChat: false,
        isAIChat: true,
        users: [userId, bot._id],
      });
    }
  }

  // Save user message
  let userMessage = await Message.create({
    sender: userId,
    content: message,
    chat: chat._id,
  });
  userMessage = await userMessage.populate("sender", "name pic");
  userMessage = await userMessage.populate("chat");

  // Fetch conversation history for context (last 20 messages)
  const historyMessages = await Message.find({ chat: chat._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate("sender", "name");

  // Reverse to chronological order
  historyMessages.reverse();

  // Format for Gemini
  const conversationHistory = historyMessages.slice(0, -1).map((msg) => ({
    role: msg.sender._id.equals(bot._id) ? "assistant" : "user",
    content: msg.content,
  }));

  // Call AI service
  let aiResponseText;
  try {
    aiResponseText = await aiService.sendMessage(conversationHistory, message);
  } catch (error) {
    console.log("AI Service Error:", error.message || error);
    aiResponseText =
      "Sorry, I'm having trouble connecting right now. Please try again later.";
  }

  // Save AI response
  let aiMessage = await Message.create({
    sender: bot._id,
    content: aiResponseText,
    chat: chat._id,
  });
  aiMessage = await aiMessage.populate("sender", "name pic");
  aiMessage = await aiMessage.populate("chat");
  aiMessage = await User.populate(aiMessage, {
    path: "chat.users",
    select: "name pic email",
  });

  // Update latest message
  await Chat.findByIdAndUpdate(chat._id, { latestMessage: aiMessage._id });

  res.status(200).json({
    userMessage,
    aiMessage,
    chat: await Chat.findById(chat._id)
      .populate("users", "-password")
      .populate("latestMessage"),
  });
});

// Summarize a chat conversation
const summarizeChat = asyncHandler(async (req, res) => {
  const { chatId } = req.body;
  const userId = req.user._id;

  if (!chatId) {
    res.status(400);
    throw new Error("chatId is required");
  }

  // Verify user belongs to chat
  const chat = await Chat.findById(chatId).populate("users", "name");
  if (!chat) {
    res.status(404);
    throw new Error("Chat not found");
  }

  const isMember = chat.users.some((u) => u._id.equals(userId));
  if (!isMember) {
    res.status(403);
    throw new Error("You are not authorized to access this chat");
  }

  // Fetch all messages
  const messages = await Message.find({ chat: chatId })
    .sort({ createdAt: 1 })
    .populate("sender", "name");

  if (messages.length === 0) {
    res.status(400);
    throw new Error("Cannot summarize an empty conversation");
  }

  let summary;
  try {
    summary = await aiService.summarizeConversation(messages);
  } catch (error) {
    res.status(503);
    throw new Error("AI service is temporarily unavailable");
  }

  res.status(200).json({
    chatId,
    summary,
    messageCount: messages.length,
    timeRange: {
      from: messages[0].createdAt,
      to: messages[messages.length - 1].createdAt,
    },
    participants: [...new Set(chat.users.map((u) => u.name))],
  });
});

module.exports = { getOrCreateAIChat, chatWithAI, summarizeChat };
