const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");
const aiService = require("../services/aiService");

//@description     Get all Messages
//@route           GET /api/Message/:chatId
//@access          Protected
const allMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat");
    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Create New Message
//@route           POST /api/Message/
//@access          Protected
const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    return res.sendStatus(400);
  }

  var newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
  };

  try {
    var message = await Message.create(newMessage);

    message = await message.populate("sender", "name pic");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    await Chat.findByIdAndUpdate(chatId, {
      latestMessage: message,
    });

    // Check if this is an AI chat — if so, generate AI response
    const chat = await Chat.findById(chatId);
    if (chat && chat.isAIChat && aiService.enabled) {
      // Get AI bot user
      const botUser = await User.findOne({ email: "ai-bot@e-talk.internal" });

      if (botUser) {
        // Fetch conversation history for context (last 20 messages)
        const historyMessages = await Message.find({ chat: chatId })
          .sort({ createdAt: -1 })
          .limit(20)
          .populate("sender", "name email");

        historyMessages.reverse();

        const conversationHistory = historyMessages.slice(0, -1).map((msg) => ({
          role: msg.sender.email === "ai-bot@e-talk.internal" ? "assistant" : "user",
          content: msg.content,
        }));

        let aiResponseText;
        try {
          aiResponseText = await aiService.sendMessage(conversationHistory, content);
        } catch (error) {
          console.log("AI Service Error in message route:", error.message);
          aiResponseText = "Sorry, I'm having trouble connecting right now. Please try again later.";
        }

        // Save AI response
        var aiMessage = await Message.create({
          sender: botUser._id,
          content: aiResponseText,
          chat: chatId,
        });

        aiMessage = await aiMessage.populate("sender", "name pic");
        aiMessage = await aiMessage.populate("chat");
        aiMessage = await User.populate(aiMessage, {
          path: "chat.users",
          select: "name pic email",
        });

        await Chat.findByIdAndUpdate(chatId, {
          latestMessage: aiMessage,
        });

        // Return both messages
        return res.json({ userMessage: message, aiMessage: aiMessage, isAIChat: true });
      }
    }

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = { allMessages, sendMessage };
