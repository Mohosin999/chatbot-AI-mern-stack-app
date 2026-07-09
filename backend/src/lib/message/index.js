const Chat = require("../../model/Chat");
const genAI = require("../../config/gemini");
const { notFound } = require("../../utils/error");

const generateChatTitle = async (userPrompt, assistantResponse) => {
  const titleModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

  const prompt = `Based on this conversation, generate a concise chat title (5-6 words) that summarizes the main topic. Do not use quotation marks, punctuation, or emojis. Return only the title as plain text.

User: ${userPrompt}
Assistant: ${assistantResponse}`;

  const result = await titleModel.generateContent(prompt);
  return result.response.text().trim();
};

const createMessage = async ({ userId, chatId, prompt }) => {
  // Find chat
  const chat = await Chat.findOne({ userId, _id: chatId });
  if (!chat) {
    throw notFound();
  }

  // Save user message
  chat.messages.push({
    role: "user",
    content: prompt,
    timestamp: Date.now(),
  });

  // Gemini model (TEXT ONLY)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

  // Generate text response
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const reply = {
    role: "assistant",
    content: text,
    timestamp: Date.now(),
  };

  // Save AI reply
  chat.messages.push(reply);

  // Generate AI title if chat still has default name
  const needsTitle = !chat.name || /^(new chat|untitled)/i.test(chat.name.trim());

  if (needsTitle) {
    try {
      const generatedTitle = await generateChatTitle(prompt, text);
      if (generatedTitle) {
        chat.name = generatedTitle;
        reply.chatName = generatedTitle;
      }
    } catch (err) {
      console.error("Failed to generate chat title:", err.message);
    }
  }

  await chat.save();

  return reply;
};

module.exports = { createMessage };
