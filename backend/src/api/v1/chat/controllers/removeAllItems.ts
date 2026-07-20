import { Request, Response, NextFunction } from "express";
import { removeAllChats } from "../../../../lib/chat";

const removeAllItems = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = req.user!.id;

  try {
    await removeAllChats(userId);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

export default removeAllItems;
