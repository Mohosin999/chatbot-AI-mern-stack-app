import { z } from "zod";

export const createMessageSchema = z.object({
  chatId: z.string(),
  prompt: z.string().min(1),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
