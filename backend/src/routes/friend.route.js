import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getPendingRequests,
  getFriends,
} from "../controller/friend.controller.js";

const router = express.Router();

router.get("/search", protectRoute, searchUsers);
router.get("/requests", protectRoute, getPendingRequests);
router.get("/list", protectRoute, getFriends);
router.post("/request", protectRoute, sendFriendRequest);
router.put("/accept/:friendshipId", protectRoute, acceptFriendRequest);
router.put("/reject/:friendshipId", protectRoute, rejectFriendRequest);
router.delete("/remove/:friendId", protectRoute, removeFriend);

export default router;
