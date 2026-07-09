const Chat = require("../../model/Chat");
const { notFound } = require("../../utils/error");

/**
 * Creates a new chat for a user.
 *
 * @param {Object} user - The user object containing user's info.
 * @returns {Promise<Object>} The created chat with its id and details.
 */
const createChat = async (user) => {
  const chatData = {
    userId: user.id,
    name: "New Chat",
    userName: user.name,
    messages: [],
  };

  const newChat = new Chat(chatData);
  await newChat.save();

  return {
    id: newChat.id,
    ...newChat._doc,
  };
};

/**
 * Fetches all chats for a user.
 *
 * @param {string} userId - The user id.
 * @returns {Promise<Object>} The created chat with its id and details.
 */
const findAll = async (userId) => {
  if (!userId) throw new Error("User id is required");

  return Chat.find({ userId }).sort({ updatedAt: -1 });
};

/**
 * Fetches a chat by its ID.
 *
 * @param {string} id - Chat ID
 * @returns
 */
const findChatById = async (id) => {
  if (!id) throw new Error("Id is required");

  const chat = await Chat.findById(id);
  if (!chat) {
    throw notFound();
  }

  return chat;
};

/**
 * Remove a chat by its ID.
 *
 * @param {string} id - Chat ID
 * @returns
 */
const removeChat = async (id) => {
  const chat = await Chat.findById(id);
  if (!chat) {
    throw notFound();
  }

  return Chat.findByIdAndDelete(id);
};

const updateChat = async (id, data) => {
  const chat = await Chat.findById(id);
  if (!chat) {
    throw notFound();
  }

  const updatedChat = await Chat.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true });
  return updatedChat;
};

module.exports = {
  createChat,
  findAll,
  findChatById,
  removeChat,
  updateChat,
};
