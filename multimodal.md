# Multimodal Input Support (Images + PDF)

This feature allows users to upload images (PNG, JPEG, WebP, HEIC, HEIF) and PDFs alongside text prompts. Files are sent to Gemini 2.5 Flash as `inlineData` parts, enabling the AI to see and reason about the content.

---

## Backend Changes

### 1. `backend/src/validator/chat.ts` — Request validation

Defines allowed MIME types and a Zod schema for file uploads.

```ts
const ALLOWED_MIME_TYPES = [
  "image/png", "image/jpeg", "image/webp",
  "image/heic", "image/heif", "application/pdf",
] as const;

const fileSchema = z.object({
  mimeType: z.enum(ALLOWED_MIME_TYPES),
  data: z.string().min(1),       // raw base64 (no prefix)
  name: z.string().min(1),       // original filename
});

export const createMessageSchema = z.object({
  chatId: z.string(),
  prompt: z.string().default(""),                          // now optional
  files: z.array(fileSchema).max(5).optional(),            // max 5 files
}).refine((data) => data.prompt || (data.files && data.files.length > 0), {
  message: "Text prompt or at least one file is required",
});
```

- `prompt` is now optional (defaults to `""`).
- At least one of `prompt` or `files` must be present.
- `FileInput` type is exported for reuse.

---

### 2. `backend/src/lib/message/index.ts` — Core Gemini logic

Two key additions:

**`buildContentParts()`** — Converts text + files into Gemini's content parts array:

```ts
const buildContentParts = (prompt: string, files?: FileInput[]) => {
  const parts: Record<string, unknown>[] = [];
  if (prompt) parts.push({ text: prompt });
  if (files) {
    for (const file of files) {
      parts.push({
        inlineData: { mimeType: file.mimeType, data: file.data },
      });
    }
  }
  return parts;
};
```

**`streamMessage()`** — Updated to accept `files` and use parts instead of plain string:

```ts
const parts = buildContentParts(prompt, files);
const result = await model.generateContentStream({
  contents: [{ role: "user", parts }]
});
```

The user message saved to MongoDB also stores file metadata for UI display:

```ts
if (files && files.length > 0) {
  userMessage.files = files.map((f) => ({ mimeType: f.mimeType, name: f.name }));
}
```

Title generation falls back to the first filename when there's no text prompt.

---

### 3. `backend/src/api/v1/message/controllers/streamCreate.ts` — Controller

Only change: destructure `files` from parsed body and pass to `streamMessage`:

```ts
const { chatId, prompt, files } = parsed.data;
// ...
const { stream, complete } = await streamMessage({
  userId, chatId, prompt, files, signal,
});
```

---

## Frontend Changes

### 4. `frontend/src/types/chat.ts` — Type definitions

Added `FileData` interface and a `files` field to `Message`:

```ts
export interface FileData {
  mimeType: string;
  data?: string;
  name: string;
}

export interface Message {
  // ...existing fields
  files?: { mimeType: string; name: string; data?: string }[];
}
```

---

### 5. `frontend/src/components/ui/ChatInput.tsx` — File upload UI

The core UI change. A **+** button is placed to the left of the textarea.

**State:**
```ts
interface SelectedFile {
  id: string;
  name: string;
  mimeType: string;
  data: string;      // raw base64 for sending
  preview: string;   // data URL for thumbnail display
}
```

**File reading** — Uses `FileReader.readAsDataURL()` to get both the display-friendly data URL and the raw base64 payload:

```ts
const readFile = (file: File): Promise<SelectedFile> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const raw = result.split(",")[1];  // strip "data:...;base64," prefix
      resolve({
        id: crypto.randomUUID(),
        name: file.name,
        mimeType: file.type,
        data: raw,
        preview: result,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
```

**File picker** — Hidden `<input type="file">` triggered by the + button, accepts only the allowed types:

```tsx
<button onClick={() => fileInputRef.current?.click()} disabled={!token || selectedFiles.length >= MAX_FILES}>
  <FaPlus size={14} />
</button>
<input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/heic,image/heif,application/pdf" multiple onChange={handleFilePick} className="hidden" />
```

**Preview area** — Shows above the textarea. Images show a thumbnail, PDFs show a PDF icon with filename. Each file has an "X" button (visible on hover) to remove it:

```tsx
{selectedFiles.map((file) => (
  <div key={file.id} className="relative group/file ...">
    {file.mimeType === "application/pdf" ? (
      <FaFilePdf className="text-red-500" />
    ) : (
      <img src={file.preview} alt={file.name} className="h-6 w-6 rounded object-cover" />
    )}
    <span>{file.name}</span>
    <button onClick={() => removeFile(file.id)} className="hidden group-hover/file:flex ...">
      <FaXmark size={8} />
    </button>
  </div>
))}
```

**Sending** — Files are stripped of preview/id and passed alongside text:

```ts
const sendMessage = () => {
  if (!text && !selectedFiles.length) return;
  const files = selectedFiles.map((f) => ({ name: f.name, mimeType: f.mimeType, data: f.data }));
  onSend(text, files);
  // reset
};
```

The `onSend` prop signature changed from `(text: string) => void` to `(text: string, files?) => void`.

---

### 6. `frontend/src/components/ContentArea.tsx` — Wiring

`handleSend` now accepts files, stores them in the user temp message, and passes them to the thunk:

```ts
const handleSend = async (text: string, files?) => {
  // ...
  const userMsg = { id: Date.now(), role: "user", content: text };
  if (files?.length) {
    userMsg.files = files.map((f) => ({ name: f.name, mimeType: f.mimeType, data: f.data }));
  }
  dispatch(addTempMessage(userMsg));

  dispatch(createMessageStream({ prompt: text, chatId: currentChatId!, files }) as any);
};
```

---

### 7. `frontend/src/features/chat/chatSlice.ts` — Thunk update

The `createMessageStream` thunk's parameter type now includes `files`:

```ts
messageData: {
  prompt: string;
  chatId: string;
  files?: { name: string; mimeType: string; data: string }[];
}
```

No other changes — `files` is automatically serialized into the JSON body via `JSON.stringify(messageData)`.

---

### 8. `frontend/src/components/Message.tsx` — File display in chat

User messages with `files` render thumbnails/PDF icons above the text:

```tsx
{msg.files?.map((file, i) =>
  file.mimeType === "application/pdf" ? (
    <div key={i} className="...">
      {/* SVG PDF icon */}
      <span>{file.name}</span>
    </div>
  ) : (
    <img key={i} src={`data:${file.mimeType};base64,${file.data}`}
         alt={file.name} className="h-16 w-16 rounded-lg object-cover" />
  )
)}
```

---

## Data Flow Summary

```
User picks file in ChatInput
  → FileReader reads as base64
  → Preview shown in input area

User clicks send
  → ContentArea creates user message with files array
  → Dispatches createMessageStream thunk with { prompt, chatId, files }

HTTP POST /api/v1/messages/stream
  → Zod validates (prompt optional, files required if no prompt)
  → streamMessage() builds Gemini content parts:
       [{ text: "..." }, { inlineData: { mimeType, data } }, ...]
  → model.generateContentStream({ contents: [{ role: "user", parts }] })

SSE response streamed back to frontend as chunks
  → Final message saved to MongoDB with file metadata

User message bubble shows image thumbnails / PDF icons
```

## Limits

| Limit | Value |
|---|---|
| Max files per message | 5 |
| Max file size | Depends on Gemini API (typically ~20MB per request) |
| Supported types | PNG, JPEG, WebP, HEIC, HEIF, PDF |
