import { z } from "zod";

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
] as const;

const fileSchema = z.object({
  mimeType: z.enum(ALLOWED_MIME_TYPES),
  data: z.string().min(1),
  name: z.string().min(1),
});

export const createMessageSchema = z.object({
  chatId: z.string(),
  prompt: z.string().default(""),
  files: z.array(fileSchema).max(5).optional(),
}).refine((data) => data.prompt || (data.files && data.files.length > 0), {
  message: "Text prompt or at least one file is required",
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type FileInput = z.infer<typeof fileSchema>;
