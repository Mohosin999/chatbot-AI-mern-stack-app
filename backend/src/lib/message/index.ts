import Chat from "../../model/Chat";
import genAI from "../../config/gemini";
import { notFound } from "../../utils/error";
import type { FileInput } from "../../validator/chat";

const buildContentParts = (prompt: string, files?: FileInput[]) => {
  const parts: Record<string, unknown>[] = [];

  if (prompt) {
    parts.push({ text: prompt });
  }

  if (files) {
    for (const file of files) {
      parts.push({
        inlineData: { mimeType: file.mimeType, data: file.data },
      });
    }
  }

  return parts;
};

const generateChatTitle = async (userPrompt: string): Promise<string> => {
  const titleModel = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

  const prompt = `Generate a concise chat title (3 words) that summarizes the main topic of this message. Do not use quotation marks, punctuation, or emojis. Return only the title as plain text.

${userPrompt}`;

  const result = await titleModel.generateContent(prompt);
  return result.response.text().trim();
};

const streamMessage = async ({
  userId,
  chatId,
  prompt,
  files,
  signal,
}: {
  userId: string;
  chatId: string;
  prompt: string;
  files?: FileInput[];
  signal?: AbortSignal;
}) => {
  const chat = await Chat.findOne({ userId, _id: chatId });
  if (!chat) {
    throw notFound();
  }

  const userMessage: Record<string, unknown> = {
    role: "user",
    content: prompt,
    timestamp: Date.now(),
  };

  if (files && files.length > 0) {
    userMessage.files = files.map((f) => ({ mimeType: f.mimeType, name: f.name }));
  }

  chat.messages.push(userMessage as any);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

  const parts = buildContentParts(prompt, files);
  const result = await model.generateContentStream({ contents: [{ role: "user", parts }] });

  let fullText = "";

  const needsTitle =
    !chat.name || /^(new chat|untitled)/i.test(chat.name.trim());

  const titleText = prompt || (files?.length ? files[0].name : "New chat");

  const titlePromise = needsTitle
    ? generateChatTitle(titleText).catch((err) => {
        console.error("Failed to generate chat title:", (err as Error).message);
        return null;
      })
    : Promise.resolve(null);

  const stream = (async function* () {
    for await (const chunk of result.stream) {
      if (signal?.aborted) break;
      const chunkText = chunk.text();
      fullText += chunkText;
      yield chunkText;
    }
  })();

  const complete = async () => {
    const reply: Record<string, unknown> = {
      role: "assistant",
      content: fullText,
      timestamp: Date.now(),
    };

    chat.messages.push(reply as any);

    const generatedTitle = await titlePromise;
    if (generatedTitle) {
      chat.name = generatedTitle;
      reply.chatName = generatedTitle;
    }

    await chat.save();
    return reply;
  };

  return { stream, complete };
};

export { streamMessage };
