import Chat from "../../model/Chat";
import { getAIProvider } from "../ai";
import { notFound } from "../../utils/error";
import { contextCompressor } from "../memory/ContextCompressor";
import { contextBudget } from "../memory/ContextBudget";
import { tokenCounter } from "../memory/TokenCounter";
import type { FileInput } from "../../validator/chat";

const provider = getAIProvider();

const generateChatTitle = async (
  userPrompt: string,
): Promise<string | null> => {
  try {
    // const titlePrompt = `Generate a concise chat title (3 words) that summarizes the main topic of this message. Do not use quotation marks, punctuation, or emojis. Return only the title as plain text.\n\n${userPrompt}`;
    const titlePrompt = `Create a short, natural-sounding chat title (3-4 words) that captures the main topic. Use title case, plain text only, no quotes, no punctuation, no emojis. Return only the title.\n\n${userPrompt}`;
    return await provider.generateContentText(titlePrompt);
  } catch (err) {
    console.error("Failed to generate chat title:", (err as Error).message);
    return null;
  }
};

const summarizeConversation = async (
  messages: { role: string; content: string }[],
): Promise<string> => {
  const text = messages
    .map((m) => `[${m.role}]: ${m.content.slice(0, 300)}`)
    .join("\n");

  const prompt = `Summarize this conversation in 2 sentences. Focus on topics discussed and any key information about the user.\n\n${text}`;
  try {
    return await provider.generateContentText(prompt);
  } catch {
    return "";
  }
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
  if (!chat) throw notFound();

  const userMessage: Record<string, unknown> = {
    role: "user",
    content: prompt,
    timestamp: Date.now(),
  };

  if (files && files.length > 0) {
    userMessage.files = files.map((f) => ({
      mimeType: f.mimeType,
      name: f.name,
    }));

    for (const f of files) {
      const truncated = contextCompressor.truncateToolResult(
        `File: ${f.name} (${f.mimeType})`,
        100,
      );
      userMessage.fileSummary = truncated.text;
    }
  }

  chat.messages.push(userMessage as any);

  const needsTitle =
    !chat.name || /^(new chat|untitled)/i.test(chat.name.trim());
  const titleText = prompt || (files?.length ? files[0].name : "New chat");

  const titlePromise = needsTitle
    ? generateChatTitle(titleText)
    : Promise.resolve(null);

  const budget = contextBudget.allocate();

  const { compressed: prunedMessages, dropped: droppedMessages } =
    contextCompressor.compressConversation(
      chat.messages as any,
      budget.history,
    );

  let droppedSummary = "";
  if (droppedMessages.length > 0) {
    droppedSummary = await summarizeConversation(
      droppedMessages.map((m) => ({ role: m.role, content: m.content })) as any,
    );
  }

  const systemPrompt = `You are an AI assistant helping ${chat.userName}. Be helpful, accurate, and concise.`;

  const contents: { role: string; parts: { text: string }[] }[] = [
    {
      role: "user",
      parts: [{ text: `[System Context]\n${systemPrompt}` }],
    },
  ];

  if (droppedSummary) {
    contents.push({
      role: "user",
      parts: [{ text: `[Earlier context]: ${droppedSummary}` }],
    });
  }

  const historyMessages = prunedMessages.slice(0, -1);
  for (const msg of historyMessages) {
    contents.push({
      role: msg.role,
      parts: [{ text: msg.content }],
    });
  }

  const needsToolTruncation = files && files.length > 0;
  let toolTruncationNote = "";
  if (needsToolTruncation) {
    toolTruncationNote = `\n[Note: ${files!.length} file(s) attached. Key information extracted where possible.]\n`;
  }

  const currentPrompt =
    prompt || (files?.length ? "Analyze the attached file(s)" : "");
  const finalPrompt = currentPrompt + toolTruncationNote;

  contents.push({
    role: "user",
    parts: [{ text: finalPrompt }],
  });

  let tokenBudget = budget.total;
  const systemTokens = tokenCounter.count(systemPrompt);
  const historyTokens = tokenCounter.count(
    historyMessages.map((m) => m.content).join(" "),
  );
  const promptTokens = tokenCounter.count(finalPrompt);
  tokenBudget -= systemTokens + historyTokens + promptTokens;

  if (tokenBudget < 100) {
    console.log(
      `[ContextBudget] Warning: only ${tokenBudget} tokens remaining for response`,
    );
  }

  contextBudget.logBudgetAllocation(budget, {
    system: systemTokens,
    history: historyTokens,
    prompt: promptTokens,
    total: systemTokens + historyTokens + promptTokens,
  });

  const genStream = provider.generateContentStream(contents, signal);

  let fullText = "";

  const stream = (async function* () {
    for await (const chunk of genStream) {
      if (signal?.aborted) break;
      fullText += chunk;
      yield chunk;
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
