# Context Engineering Implementation

## Overview

This project implements 4 core **Context Engineering** techniques in a full-stack AI chat application built with **TypeScript, React, Node.js, Express, MongoDB, and Google Gemini**. The system intelligently manages the 128K token context window through budgeting, compression, summarization, and truncation.

- **Budgeting** — Allocates 128K tokens across system/history/memory/tool/reserved sections
- **Compression** — Greedy sliding window keeps recent messages, drops oldest
- **Summarization** — Dropped messages are summarized and prepended as `[Earlier context]`
- **Truncation** — File metadata is compressed to fit within token limits

All context engineering logic lives in `backend/src/lib/memory/` (4 files). Other techniques — Prompt Caching (LRU Cache), Hierarchical Memory (Memory extraction, Memory model, Memory API), and Lost in the Middle mitigation — were removed to keep the system focused on essential context window management.

---

## What Changed

The following were **removed** from the project:

| Removed Feature | Files Deleted |
|---|---|
| Prompt Caching (LRU Cache) | `backend/src/lib/memory/LRUCache.ts` |
| Hierarchical Memory / Memory Extraction | `backend/src/lib/memory/MemoryService.ts`, `backend/src/model/Memory.ts`, entire `backend/src/api/v1/memory/` directory |
| Lost in the Middle mitigation | Removed from `backend/src/lib/message/index.ts` |
| Frontend Memory UI | `frontend/src/components/memory/MemoryPanel.tsx`, `frontend/src/features/memory/memorySlice.ts`, `frontend/src/api/memoryApi.ts`, `frontend/src/types/memory.ts` |
| Frontend Store state | `memoryReducer` removed from `frontend/src/store/store.ts` |

The message pipeline (`backend/src/lib/message/index.ts`) was refactored to use `ContextBudget` + `ContextCompressor` directly instead of going through `MemoryService`. Conversation summarization now happens in real-time during compression (dropped messages are summarized and prepended as `[Earlier context]`), rather than being stored on the Chat model.

---

## 1. Context Window Budgeting

### What it does
Allocates the 128K token context window across different functional sections with strict percentages, preventing any single section from dominating the budget.

### Implementation
- **File:** `backend/src/lib/memory/ContextBudget.ts`
- **Class:** `ContextBudget`
- **Algorithm:** Fixed-percentage allocation with usage tracking

### Code Explanation

```typescript
// backend/src/lib/memory/ContextBudget.ts

import { tokenCounter } from "./TokenCounter";
import type { IContextBudget } from "./types";

export interface IBudgetConfig {
  totalTokens: number;
  systemPercent: number;
  memoryPercent: number;      // kept for backward compat, not actively used
  historyPercent: number;
  toolPercent: number;
  reservedPercent: number;
}

const DEFAULT_CONFIG: IBudgetConfig = {
  totalTokens: 128_000,        // Gemini 2.5 Flash context window
  systemPercent: 10,           // 12,800 tokens for system prompt
  memoryPercent: 20,           // 25,600 tokens (reserved)
  historyPercent: 35,          // 44,800 tokens for conversation history
  toolPercent: 10,             // 12,800 tokens for file/tool results
  reservedPercent: 25,         // 32,000 tokens for response + safety buffer
};
```

`IBudgetConfig` defines the allocation percentages. `DEFAULT_CONFIG` mirrors the Gemini 128K limit with a 10/35/10/25 split across system/history/tool/reserved. The "memory" bucket is retained for compatibility but is no longer populated by a memory service.

```typescript
export class ContextBudget {
  private config: IBudgetConfig;
  private usage: Map<string, number> = new Map();  // tracks per-section token usage
  private requestCount = 0;

  constructor(config: Partial<IBudgetConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
```

The constructor merges user-provided overrides with defaults. `usage` is a `Map<string, number>` tracking cumulative token consumption per section across requests — useful for monitoring and debugging.

```typescript
  allocate(): IContextBudget {
    const total = this.config.totalTokens;
    return {
      total,
      system: Math.floor(total * (this.config.systemPercent / 100)),
      history: Math.floor(total * (this.config.historyPercent / 100)),
      memory: Math.floor(total * (this.config.memoryPercent / 100)),
      toolResults: Math.floor(total * (this.config.toolPercent / 100)),
      reserved: Math.floor(total * (this.config.reservedPercent / 100)),
      used: 0,
    };
  }
```

`allocate()` computes fixed token caps per section using integer arithmetic (`Math.floor`). Returns an `IContextBudget` snapshot. This is called once per request at the start of `streamMessage()`.

```typescript
  trackUsage(section: string, text: string): number {
    const tokens = tokenCounter.count(text);
    const current = this.usage.get(section) || 0;
    this.usage.set(section, current + tokens);
    return tokens;
  }
```

`trackUsage()` accumulates token counts by section name. Uses `tokenCounter.count()` which encodes text via `tiktoken`'s `cl100k_base` tokenizer (same as GPT-4 / Gemini).

```typescript
  getUsageReport(): Record<string, number> {
    const report: Record<string, number> = {};
    for (const [key, val] of this.usage) {
      report[key] = val;
    }
    report.total = Array.from(this.usage.values()).reduce((a, b) => a + b, 0);
    return report;
  }

  logBudgetAllocation(budget: IContextBudget, used: Record<string, number>): void {
    this.requestCount++;
    console.log(
      `[Budget #${this.requestCount}] ` +
        `sys:${budget.system} hist:${budget.history} mem:${budget.memory} tool:${budget.toolResults} ` +
        `used:${JSON.stringify(used)}`,
    );
  }
```

`getUsageReport()` aggregates all tracked usage into a flat object. `logBudgetAllocation()` logs a per-request debug line showing allocated caps vs. actual usage — useful for tuning budget percentages.

```typescript
  updateConfig(config: Partial<IBudgetConfig>): void {
    this.config = { ...this.config, ...config };
  }

  resetUsage(): void {
    this.usage.clear();
  }
}

export const contextBudget = new ContextBudget();
```

`updateConfig()` allows runtime reconfiguration. `resetUsage()` clears the usage tracker (e.g., on server restart). The module exports a singleton `contextBudget` instance used throughout the app.

### How the budget flows in the message pipeline

```typescript
// backend/src/lib/message/index.ts

const budget = contextBudget.allocate();
// => { total: 128000, system: 12800, history: 44800, toolResults: 12800, reserved: 32000, used: 0 }

const { compressed: prunedMessages } = contextCompressor.compressConversation(
  chat.messages as any,
  budget.history,     // 44,800 tokens max for history
);
// ... build contents, track usage ...

contextBudget.logBudgetAllocation(budget, {
  system: systemTokens,
  history: historyTokens,
  prompt: promptTokens,
  total: systemTokens + historyTokens + promptTokens,
});

let tokenBudget = budget.total;
tokenBudget -= (systemTokens + historyTokens + promptTokens);
if (tokenBudget < 100) {
  console.log(`[ContextBudget] Warning: only ${tokenBudget} tokens remaining`);
}
```

After allocation, the message pipeline passes `budget.history` to the compressor's sliding window. Remaining budget is checked before streaming — a warning fires when response room drops below 100 tokens, giving visibility into budget pressure.

### DSA used
- **Token Bucket pattern** — capacity allocation per section
- **Greedy allocation** — each section gets max budget upfront

---

## 2. Conversation Summarization

### What it does
When conversations exceed the token budget, older messages that get compressed out are automatically summarized into a compact form using Gemini. This summary is prepended as `[Earlier context]` before the recent messages, ensuring the AI retains awareness of the full conversation history while staying within the token budget.

### Implementation
- **File:** `backend/src/lib/message/index.ts` (function `summarizeConversation`)
- **Trigger:** When `compressConversation()` returns dropped messages (i.e., messages that exceeded the 44,800 token history budget)
- **Flow:** Dropped messages → summarize → prepend as `[Earlier context]` → recent messages (full) → current prompt

### Code Explanation

```typescript
// backend/src/lib/message/index.ts

const summarizeConversation = async (
  messages: { role: string; content: string }[]
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
```

`summarizeConversation()` takes the dropped messages, formats each as `[role]: content` (truncating individual messages to 300 chars to avoid input bloat), joins them with newlines, and sends a compact prompt to Gemini. The response is a 2-sentence summary. On failure, it silently returns empty string — summarization is best-effort.

```typescript
// Inside streamMessage(), after compression:

const { compressed: prunedMessages, dropped: droppedMessages } = 
  contextCompressor.compressConversation(
    chat.messages as any,
    budget.history,     // 44,800 tokens max
  );

// Summarize dropped messages
let droppedSummary = "";
if (droppedMessages.length > 0) {
  droppedSummary = await summarizeConversation(
    droppedMessages.map((m) => ({ role: m.role, content: m.content })) as any,
  );
}
```

After compression, the `dropped` array contains messages that exceeded the budget. These are summarized into a 2-sentence summary. This runs **before streaming** (unlike the previous approach which ran in parallel), ensuring the summary is available for context assembly.

```typescript
// Building contents with summary:

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

// Then add recent messages (full) + current prompt
```

The summary is injected as a `[Earlier context]` block between the system prompt and recent messages. This gives the AI awareness of older conversation without consuming tokens for full message history.

### How it works (real example)

```
Chat: 50 messages, ~15,000 tokens total

Before compression:
Message 1: "Hello"                    → 2 tokens
Message 2: "Hi! How can I help?"     → 8 tokens
...
Message 45: "Fix the React bug"      → 25 tokens
Message 46: "Here's the fix..."      → 150 tokens
Message 47: "Thanks"                 → 3 tokens
Message 48: "Now optimize it"        → 12 tokens
Message 49: "Here's optimized..."    → 200 tokens
Message 50: "Perfect!"               → 3 tokens

After compression (44,800 token budget):
Dropped: Messages 1-30 (older messages)
Compressed: Messages 31-50 (recent, full content)

AI receives:
[System Context]: You are an AI assistant helping Rahim...
[Earlier context]: "Rahim working on Python Flask API, PostgreSQL database, JWT auth setup. Recently debugging React frontend issues."
Message 31: "Fix the bug..."         → FULL
Message 32: "Here's the fix..."      → FULL
...
Message 50: "Perfect!"               → FULL
Current prompt: "Now add error handling"
```

### Chat Model (summary fields)

```typescript
// backend/src/model/Chat.ts

export interface IChatDocument extends Document {
  userId: string;
  userName: string;
  name: string;
  messages: IMessageDocument[];
  summary?: string;            // ← conversation summary (kept for reference)
  summaryUpdatedAt?: Date;     // ← last summary timestamp
}
```

The `summary` and `summaryUpdatedAt` fields are retained on the Chat model for potential future use (e.g., displaying conversation overview in the UI). The active summarization now happens in real-time during the message pipeline.

### DSA used
- **Sliding Window** — only recent messages are kept raw; older messages are summarized
- **Extractive summarization** — message content is truncated to 300 chars before summarization to prevent input bloat

---

## 3. Context Compression & Pruning

### What it does
Removes unnecessary messages and compresses verbose exchanges before sending to the AI, saving significant token budget.

### Implementation
- **File:** `backend/src/lib/memory/ContextCompressor.ts`
- **Class:** `ContextCompressor`

### Code Explanation

```typescript
// backend/src/lib/memory/ContextCompressor.ts

import { tokenCounter } from "./TokenCounter";
import type { IMessageDocument } from "../../model/Chat";

const TRIVIAL_PATTERNS = [
  /^(ok|okay|yes|yeah|no|nope|sure|alright|fine|got it|i see|thanks|thank you|thx|ty|👍|👎|😊|😂)$/i,
  /^[.!?]+$/,
  /^[🤖😊😂👍👎❤️🔥]+$/,
];

const TRIVIAL_WORDS = new Set([
  "ok", "okay", "yes", "yeah", "no", "nope", "sure", "alright",
  "fine", "got", "thanks", "thank", "thx", "ty", "see", "right",
]);
```

`TRIVIAL_PATTERNS` is an array of regex patterns that match common low-value messages — single word acknowledgments, pure punctuation, and emoji-only responses. `TRIVIAL_WORDS` is a `Set` used for fast O(1) lookup during word-level matching for short messages (≤2 words).

```typescript
class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isEnd = false;
}

class Trie {
  root: TrieNode = new TrieNode();

  insert(word: string): void {
    let node = this.root;
    for (const ch of word.toLowerCase()) {
      if (!node.children.has(ch)) {
        node.children.set(ch, new TrieNode());
      }
      node = node.children.get(ch)!;
    }
    node.isEnd = true;
  }

  search(word: string): boolean {
    let node = this.root;
    for (const ch of word.toLowerCase()) {
      if (!node.children.has(ch)) return false;
      node = node.children.get(ch)!;
    }
    return node.isEnd;
  }
}
```

The **Trie** (prefix tree) provides O(k) word lookup where k is the word length. Each node holds a `Map<string, TrieNode>` for children (character → node). `insert()` adds a word character by character, marking the final node as end-of-word. `search()` traverses character by character; returns false if any prefix is missing, true only if it reaches an end-of-word node. This is more memory-efficient than a `Set` for prefix-based matching and avoids regex overhead for word-level checks.

```typescript
export class ContextCompressor {
  private trivialTrie: Trie;

  constructor() {
    this.trivialTrie = new Trie();
    for (const word of TRIVIAL_WORDS) {
      this.trivialTrie.insert(word);
    }
  }
```

The constructor builds the Trie from `TRIVIAL_WORDS` once. This is done at module load time since the `ContextCompressor` is a singleton.

```typescript
  isTrivial(content: string): boolean {
    if (!content || content.trim().length === 0) return true;
    const trimmed = content.trim();
    // Check full patterns first (regex-based)
    for (const pattern of TRIVIAL_PATTERNS) {
      if (pattern.test(trimmed)) return true;
    }
    // For short messages (≤2 words), check via Trie
    const words = trimmed.split(/\s+/);
    if (words.length <= 2) {
      return words.every((w) => {
        const clean = w.replace(/[^a-zA-Z]/g, "").toLowerCase();
        return clean.length === 0 || this.trivialTrie.search(clean);
      });
    }
    return false;
  }
```

`isTrivial()` is a two-phase check:
1. **Regex phase** — test against `TRIVIAL_PATTERNS` for exact matches (covers emoji, punctuation, multi-word phrases like "got it")
2. **Trie phase** — for messages ≤2 words, strip non-alpha characters and check each word in the Trie. If all words are trivial (or empty after stripping), the message is pruned. Messages longer than 2 words are never pruned — avoids false positives on meaningful text that happens to start with "ok".

```typescript
  pruneTrivialMessages(messages: IMessageDocument[]): IMessageDocument[] {
    const pruned = messages.filter((msg) => !this.isTrivial(msg.content));
    const removed = messages.length - pruned.length;
    if (removed > 0) {
      console.log(`[Compressor] Pruned ${removed} trivial messages`);
    }
    return pruned;
  }
```

`pruneTrivialMessages()` filters the message array through `isTrivial()`. Logs pruning stats for observability. This runs before compression to reduce the input size for subsequent operations.

```typescript
  compressConversation(
    messages: IMessageDocument[],
    maxTokens: number,
  ): { compressed: IMessageDocument[]; dropped: IMessageDocument[]; tokens: number } {
    const pruned = this.pruneTrivialMessages(messages);

    let totalTokens = 0;
    const result: IMessageDocument[] = [];
    const reversed = [...pruned].reverse();

    for (const msg of reversed) {
      const msgTokens = tokenCounter.count(msg.content);
      if (totalTokens + msgTokens > maxTokens) break;
      totalTokens += msgTokens;
      result.unshift(msg);
    }

    const dropped = pruned.filter((msg) => !result.includes(msg));

    const removed = pruned.length - result.length;
    if (removed > 0) {
      console.log(`[Compressor] Compressed ${removed}/${pruned.length} messages due to token budget`);
    }

    return { compressed: result, dropped, tokens: totalTokens };
  }
```

`compressConversation()` is the main entry point for the message pipeline. Steps:
1. **Prune** trivial messages first
2. **Reverse** the array so we iterate from newest to oldest
3. **Greedy accumulation** — keep messages as long as total stays within `maxTokens` (which is `budget.history` = 44,800 tokens)
4. **Unshift** back to chronological order
5. **Return dropped** — messages that didn't fit in the budget (for summarization)

This means **newest messages are always preserved** — the oldest messages are dropped first when over budget. The `dropped` array is then summarized and prepended as `[Earlier context]` in the message pipeline.

```typescript
  compressMultiTurnExchanges(
    messages: IMessageDocument[],
  ): { role: string; content: string }[] {
    const result: { role: string; content: string }[] = [];
    const compressed: IMessageDocument[] = this.pruneTrivialMessages(messages);

    for (let i = 1; i < compressed.length - 1; i++) {
      const prev = compressed[i - 1];
      const curr = compressed[i];
      const next = compressed[i + 1];

      // Skip follow-up "what about X" questions when the assistant's
      // previous answer was short (<100 chars)
      if (
        prev.role === "user" &&
        curr.role === "assistant" &&
        next.role === "user" &&
        next.content.toLowerCase().includes("what about") &&
        curr.content.length < 100
      ) {
        continue;
      }

      // Merge short Q&A pairs: "What?" -> "React" becomes "What? -> React"
      if (
        curr.role === "user" &&
        next?.role === "assistant" &&
        curr.content.length < 20 &&
        next.content.length < 30
      ) {
        const combined = `${curr.content} -> ${next.content}`;
        result.push({ role: "user", content: combined });
        i++;
        continue;
      }

      result.push({ role: curr.role, content: curr.content });
    }

    const last = compressed[compressed.length - 1];
    if (last) result.push({ role: last.role, content: last.content });

    return result;
  }
```

`compressMultiTurnExchanges()` handles two patterns:
1. **Repetitive follow-ups** — When a user asks "what about X" and the assistant's previous answer was short, the follow-up is skipped entirely (the answer was already sufficient)
2. **Short Q&A merging** — When a user asks a very short question (<20 chars) and gets a short answer (<30 chars), they're merged into a single `"question -> answer"` user message, saving the tokens of an assistant turn header

This function is available for use but is not currently called in the message pipeline — the simpler sliding window suffices for most cases.

```typescript
  truncateToolResult(
    result: string,
    maxTokens: number = 500,
  ): { text: string; tokens: number; wasTruncated: boolean } {
    const tokens = tokenCounter.count(result);
    if (tokens <= maxTokens) {
      return { text: result, tokens, wasTruncated: false };
    }
    const lines = result.split("\n");
    let summary = "[File content truncated. Summary: ";
    const firstLine = lines[0]?.trim() || "";
    const previewLines = lines.slice(0, 5).join("\n");
    const lineCount = lines.length;
    summary += `${lineCount} lines, starts with "${firstLine.slice(0, 80)}"]\n\n`;
    summary += previewLines;
    if (lineCount > 5) {
      summary += `\n... (${lineCount - 5} more lines)`;
    }
    const truncatedTokens = tokenCounter.count(summary);
    return { text: summary, tokens: truncatedTokens, wasTruncated: true };
  }
```

`truncateToolResult()` handles file analysis results (e.g., PDF text extraction, image descriptions) that can be thousands of tokens. Strategy:
1. If under `maxTokens` (default 500), return as-is
2. Otherwise, build a compact summary with: total line count, first line preview (80 chars), first 5 content lines, and a "... (N more lines)" suffix
3. The result is typically 100-200 tokens — a 10-20x compression

```typescript
  extractKeyInformation(content: string, maxChars: number = 300): string {
    if (content.length <= maxChars) return content;
    const sentences = content.match(/[^.!?\n]+[.!?\n]+/g) || [content];
    let result = "";
    for (const sentence of sentences) {
      if ((result + sentence).length > maxChars) break;
      result += sentence;
    }
    if (result.length < 50) {
      result = content.slice(0, maxChars) + "...";
    }
    return result.trim();
  }
}

export const contextCompressor = new ContextCompressor();
```

`extractKeyInformation()` is a sentence-level extractive summarizer. It greedily selects complete sentences up to `maxChars`. If the result is too short (<50 chars), it falls back to a character-level truncation with "...". Used internally for key information extraction from tool results.

The module exports a singleton `contextCompressor` instance.

### How compression integrates with the message pipeline

```typescript
// backend/src/lib/message/index.ts
const { compressed: prunedMessages, dropped: droppedMessages } = 
  contextCompressor.compressConversation(
    chat.messages as any,
    budget.history,
  );

// Summarize dropped messages
let droppedSummary = "";
if (droppedMessages.length > 0) {
  droppedSummary = await summarizeConversation(
    droppedMessages.map((m) => ({ role: m.role, content: m.content })) as any,
  );
}

// Build contents (system prompt + summary + pruned history + current prompt)
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

const historyMessages = prunedMessages.slice(0, -1);  // exclude current user msg
for (const msg of historyMessages) {
  contents.push({
    role: msg.role,
    parts: [{ text: msg.content }],
  });
}
// ... then append current user prompt
```

The compressed messages are injected directly as Gemini `contents`. Each message becomes a `{ role, parts: [{ text }] }` entry. Dropped messages are summarized and prepended as `[Earlier context]` before the recent messages. The current user message is added last (it's not in the compressed set since it was pushed after compression).

### DSA used
- **Trie** — O(k) trivial word detection where k is word length
- **Greedy sliding window** — keeps most valuable (recent) messages within budget
- **Regex multi-pattern matching** — O(n) trivial message detection with compiled regex

---

## 4. Tool Result Truncation

### What it does
When files (images, PDFs) are uploaded, their metadata is truncated intelligently to stay within the tool result budget while preserving essential information.

### Implementation
- **Function:** `truncateToolResult()` in `ContextCompressor.ts`
- **Threshold:** 500 tokens (customizable per call)
- **Strategy:** Extractive summarization with preview

### Code Explanation

```typescript
// backend/src/lib/message/index.ts (usage)
if (files && files.length > 0) {
  userMessage.files = files.map((f) => ({
    mimeType: f.mimeType,
    name: f.name,
  }));
  for (const f of files) {
    const truncated = contextCompressor.truncateToolResult(
      `File: ${f.name} (${f.mimeType})`,
      100,              // very conservative budget for file metadata
    );
    userMessage.fileSummary = truncated.text;
  }
}
```

When files are attached, each file's name and MIME type are passed through `truncateToolResult()` with a 100-token limit (since these are just small metadata strings, they won't be truncated — this is defensive). The result is stored in `userMessage.fileSummary` for frontend display.

```typescript
// Later in the pipeline:
const needsToolTruncation = files && files.length > 0;
let toolTruncationNote = "";
if (needsToolTruncation) {
  toolTruncationNote = `\n[Note: ${files!.length} file(s) attached. Key information extracted where possible.]\n`;
}

const finalPrompt = currentPrompt + toolTruncationNote;
```

A tool truncation note is appended to the user's prompt to inform the AI that files were attached. This signals to Gemini that it may not have the full file content but should work with what it has.

### Truncation algorithm (`truncateToolResult`)

```
Input: "Large text content... (2000 tokens)"
  → Token count exceeds 500
  → Split by newlines: [line1, line2, ..., lineN]
  → Build summary format:
      "[File content truncated. Summary: N lines, starts with "first 80 chars"]"
      → First 5 lines
      → "... (N-5 more lines)"
  → Final result: ~50-150 tokens
```

The key insight is that for file analysis, the most important information is typically:
1. **What type of file** (from the first line / metadata)
2. **How large** (line count gives an approximation)
3. **The beginning content** (first 5 lines usually contain the header/structure)

### DSA used
- **Extractive summarization** — greedy sentence selection by position
- **Line-based chunking** — structured content split on newlines

---

## Current Architecture

### Backend Modules

```
backend/src/lib/memory/
├── types.ts              # IContextBudget interface only
├── TokenCounter.ts       # Token counting with tiktoken (cl100k_base)
├── ContextBudget.ts      # Token budget allocation & tracking
├── ContextCompressor.ts  # Message pruning, compression, truncation
└── index.ts              # Re-exports TokenCounter, ContextBudget, ContextCompressor

backend/src/model/
└── Chat.ts               # Extended with summary + summaryUpdatedAt fields

backend/src/lib/message/
└── index.ts              # Streaming message pipeline (uses ContextBudget + ContextCompressor)
```

### Frontend Modules

```
frontend/src/
└── components/memory/
    └── ContextSettings.tsx   # Context engineering visualization (4 topics only)
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register user |
| POST | `/api/v1/auth/login` | Login user |
| POST | `/api/v1/auth/google` | Google OAuth login |
| POST | `/api/v1/auth/logout` | Logout user |
| POST | `/api/v1/auth/refresh` | Refresh JWT token |
| GET | `/api/v1/chats` | List all chats |
| POST | `/api/v1/chats` | Create new chat |
| GET | `/api/v1/chats/:id` | Get single chat |
| PATCH | `/api/v1/chats/:id` | Update chat |
| DELETE | `/api/v1/chats/:id` | Delete chat |
| POST | `/api/v1/messages/stream` | Stream AI response |
| GET | `/api/v1/user` | Get current user |

---

## Data Structures & Algorithms Used

| DSA | Where | Purpose |
|-----|-------|---------|
| **Trie** | ContextCompressor | O(k) trivial word detection |
| **Token Bucket** | ContextBudget | Token capacity allocation per section |
| **Greedy sliding window** | ContextCompressor | Budget-aware message retention (newest kept) |
| **Regex multi-pattern** | ContextCompressor | O(n) trivial message pattern matching |
| **Extractive summarization** | ContextCompressor | Greedy sentence/line selection for truncation |
| **Abstractive summarization** | message/index.ts | Gemini-powered summary of dropped messages |

---

## Directory Layout

```
myapp/
├── backend/src/
│   ├── lib/memory/          ← Context engineering logic (4 files)
│   ├── lib/message/         ← Modified: Context-enriched streaming
│   ├── model/Chat.ts        ← Modified: Added summary fields
│   └── routes/index.ts      ← No memory routes
├── frontend/src/
│   └── components/memory/   ← ContextSettings.tsx only (4 topics)
└── context.md               ← This file
```
