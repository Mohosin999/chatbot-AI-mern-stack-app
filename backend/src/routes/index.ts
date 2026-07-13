import { Router } from "express";
import authenticate from "../middleware/authenticate";
import authenticateRefresh from "../middleware/authenticateRefresh";
import { controllers as authController } from "../api/v1/auth";
import { controllers as chatController } from "../api/v1/chat";
import { controllers as messageController } from "../api/v1/message";
import { controllers as userController } from "../api/v1/user";
const router = Router();

router
  .post("/api/v1/auth/register", authController.register)
  .post("/api/v1/auth/login", authController.login)
  .post("/api/v1/auth/google", authController.googleLogin)
  .post("/api/v1/auth/logout", authenticate, authController.logout)
  .post(
    "/api/v1/auth/refresh",
    authenticateRefresh,
    authController.refreshToken,
  );

router
  .route("/api/v1/chats")
  .get(authenticate, chatController.findAllItems)
  .post(authenticate, chatController.create);

router
  .route("/api/v1/chats/:id")
  .get(authenticate, chatController.findSingleItem)
  .patch(authenticate, chatController.updateItem)
  .delete(authenticate, chatController.removeItem);

router.post(
  "/api/v1/messages/stream",
  authenticate,
  messageController.streamCreate,
);

router.get("/api/v1/user", authenticate, userController.getUser);

export default router;
