import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getUsersForSidebar, getMesssage, sendMesssage, markMessagesAsRead } from "../controller/message.controller.js"; // Import the new controller

const router = express.Router();

router.get("/users",protectRoute,getUsersForSidebar);

router.get("/:id",protectRoute, getMesssage);

router.post("/send/:id",protectRoute, sendMesssage);

// NEW ROUTE TO MARK MESSAGES AS READ
router.post("/read", protectRoute, markMessagesAsRead);

export default router;