import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getUsersForSidebar } from "../controller/message.controller.js";
import { getMesssage } from "../controller/message.controller.js";
import { sendMesssage } from "../controller/message.controller.js";

const router = express.Router();

router.get("/users",protectRoute,getUsersForSidebar);

router.get("/:id",protectRoute, getMesssage);

router.post("/send/:id",protectRoute, sendMesssage);

export default router;