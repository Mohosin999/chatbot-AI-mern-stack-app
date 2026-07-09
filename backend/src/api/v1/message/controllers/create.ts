import { Request, Response, NextFunction } from "express";
import { createMessage } from "../../../../lib/message";
import { createMessageSchema } from "../../../../validator/chat";

const create = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = req.user!.id;

  const parsed = createMessageSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: "Validation failed",
      errors: parsed.error.errors.map((e) => e.message),
    });
    return;
  }

  const { chatId, prompt } = parsed.data;

  try {
    const replyFromAI = await createMessage({ userId, chatId, prompt });

    const response = {
      code: 201,
      message: "Successfully Created a New Message",
      data: replyFromAI,
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export default create;
