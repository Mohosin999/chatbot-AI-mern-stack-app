import express, { Request, Response, NextFunction } from "express";
import applyMiddleware from "./middleware";
import routes from "./routes";
import { IAppError } from "./utils/error";

const app = express();

applyMiddleware(app);
app.use(routes);

app.get("/", (_req: Request, res: Response) => {
  res.send("SmartChat - AI Chatbot");
});

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    health: "OK",
    user: req.user,
  });
});

app.use((err: IAppError, _req: Request, res: Response, _next: NextFunction) => {
  console.log(err);
  res.status(err.status || 500).json({
    message: err.message,
    errors: err.errors,
  });
});

export default app;
