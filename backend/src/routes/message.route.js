import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getUsersForSidebar, getMesssage, sendMesssage, markMessagesAsSeen } from "../controller/message.controller.js";

const router = express.Router();

router.get("/users",protectRoute,getUsersForSidebar);

router.get("/:id",protectRoute, getMesssage);

router.post("/send/:id",protectRoute, sendMesssage);

// Route to mark messages as seen
router.post("/seen", protectRoute, markMessagesAsSeen);

export default router;