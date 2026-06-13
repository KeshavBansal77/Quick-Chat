const Groq = require("groq-sdk");
const { GROQ_API_KEY } = require("../config/keys");

class AIService {
  constructor() {
    if (!GROQ_API_KEY || GROQ_API_KEY === "YOUR_GROQ_API_KEY") {
      console.log("⚠️  AI Service: GROQ_API_KEY not configured. AI features disabled.");
      this.enabled = false;
      return;
    }
    console.log("✅ AI Service: Groq API configured successfully.");
    this.enabled = true;
    this.client = new Groq({ apiKey: GROQ_API_KEY });
    this.model = "llama-3.3-70b-versatile";
  }

  async sendMessage(conversationHistory, userMessage) {
    if (!this.enabled) {
      throw new Error("AI features are not configured. Add GROQ_API_KEY to your config.");
    }

    const messages = [
      {
        role: "system",
        content: "You are Quick Chat AI Assistant. You are helpful, friendly, and concise. Keep responses under 300 words unless asked for detail.",
      },
      ...conversationHistory.map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      })),
      { role: "user", content: userMessage },
    ];

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    return response.choices[0].message.content;
  }

  async summarizeConversation(messages) {
    if (!this.enabled) {
      throw new Error("AI features are not configured. Add GROQ_API_KEY to your config.");
    }

    // Format messages as a transcript
    const transcript = messages
      .map((msg) => `${msg.sender.name}: ${msg.content}`)
      .join("\n");

    // Truncate if too long
    const truncated =
      transcript.length > 12000 ? transcript.slice(-12000) : transcript;

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content:
            "Summarize the following conversation concisely. Highlight key topics discussed, decisions made, and action items. Keep the summary under 200 words.",
        },
        { role: "user", content: truncated },
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    return response.choices[0].message.content;
  }
}

module.exports = new AIService();
