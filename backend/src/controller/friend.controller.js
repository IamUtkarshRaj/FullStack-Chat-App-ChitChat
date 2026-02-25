import User from "../models/user.model.js";
import Friendship from "../models/friendship.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

/** Search users by username (excludes self and existing friends) */
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const myId = req.user._id;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: "Search query must be at least 2 characters" });
    }

    const query = q.toLowerCase().replace(/^@/, ""); // strip leading @

    // Find users matching the query by username or fullName
    const users = await User.find({
      _id: { $ne: myId },
      $or: [
        { username: { $regex: query, $options: "i" } },
        { fullName: { $regex: query, $options: "i" } },
      ],
    })
      .select("fullName username profilePic")
      .limit(20);

    // Get all friendships involving the current user
    const friendships = await Friendship.find({
      $or: [{ requester: myId }, { recipient: myId }],
      status: { $in: ["pending", "accepted"] },
    });

    // Build a map of userId → friendship status
    const friendshipMap = {};
    friendships.forEach((f) => {
      const otherId =
        f.requester.toString() === myId.toString()
          ? f.recipient.toString()
          : f.requester.toString();
      const isSender = f.requester.toString() === myId.toString();
      friendshipMap[otherId] = {
        status: f.status,
        isSender,
        friendshipId: f._id,
      };
    });

    // Attach friendship info to each user result
    const results = users.map((user) => ({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      profilePic: user.profilePic,
      friendship: friendshipMap[user._id.toString()] || null,
    }));

    res.status(200).json(results);
  } catch (error) {
    console.error("Error in searchUsers:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

/** Send a friend request */
export const sendFriendRequest = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const requesterId = req.user._id;

    if (requesterId.toString() === recipientId) {
      return res.status(400).json({ message: "You can't add yourself" });
    }

    // Check if a friendship already exists in either direction
    const existing = await Friendship.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId },
      ],
    });

    if (existing) {
      if (existing.status === "accepted") {
        return res.status(400).json({ message: "Already friends" });
      }
      if (existing.status === "pending") {
        return res.status(400).json({ message: "Friend request already pending" });
      }
      // If rejected, allow re-sending by updating
      if (existing.status === "rejected") {
        existing.requester = requesterId;
        existing.recipient = recipientId;
        existing.status = "pending";
        await existing.save();

        // Notify recipient via socket
        const recipientSocketId = getReceiverSocketId(recipientId);
        if (recipientSocketId) {
          const requesterUser = await User.findById(requesterId).select("fullName username profilePic");
          io.to(recipientSocketId).emit("friendRequestReceived", {
            friendshipId: existing._id,
            requester: requesterUser,
          });
        }

        return res.status(200).json({ message: "Friend request sent", friendship: existing });
      }
    }

    const friendship = new Friendship({
      requester: requesterId,
      recipient: recipientId,
      status: "pending",
    });
    await friendship.save();

    // Notify recipient via socket
    const recipientSocketId = getReceiverSocketId(recipientId);
    if (recipientSocketId) {
      const requesterUser = await User.findById(requesterId).select("fullName username profilePic");
      io.to(recipientSocketId).emit("friendRequestReceived", {
        friendshipId: friendship._id,
        requester: requesterUser,
      });
    }

    res.status(201).json({ message: "Friend request sent", friendship });
  } catch (error) {
    console.error("Error in sendFriendRequest:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

/** Accept a friend request */
export const acceptFriendRequest = async (req, res) => {
  try {
    const { friendshipId } = req.params;
    const userId = req.user._id;

    const friendship = await Friendship.findById(friendshipId);
    if (!friendship) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    // Only the recipient can accept
    if (friendship.recipient.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (friendship.status !== "pending") {
      return res.status(400).json({ message: "Request is no longer pending" });
    }

    friendship.status = "accepted";
    await friendship.save();

    // Add each other to friends arrays
    await User.findByIdAndUpdate(friendship.requester, {
      $addToSet: { friends: friendship.recipient },
    });
    await User.findByIdAndUpdate(friendship.recipient, {
      $addToSet: { friends: friendship.requester },
    });

    // Notify the requester via socket that their request was accepted
    const requesterSocketId = getReceiverSocketId(friendship.requester.toString());
    if (requesterSocketId) {
      const acceptedByUser = await User.findById(userId).select("fullName username profilePic");
      io.to(requesterSocketId).emit("friendRequestAccepted", {
        friendshipId: friendship._id,
        acceptedBy: acceptedByUser,
      });
    }

    res.status(200).json({ message: "Friend request accepted", friendship });
  } catch (error) {
    console.error("Error in acceptFriendRequest:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

/** Reject a friend request */
export const rejectFriendRequest = async (req, res) => {
  try {
    const { friendshipId } = req.params;
    const userId = req.user._id;

    const friendship = await Friendship.findById(friendshipId);
    if (!friendship) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    // Only the recipient can reject
    if (friendship.recipient.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    friendship.status = "rejected";
    await friendship.save();

    res.status(200).json({ message: "Friend request rejected" });
  } catch (error) {
    console.error("Error in rejectFriendRequest:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

/** Remove a friend */
export const removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user._id;

    // Remove from both friends arrays
    await User.findByIdAndUpdate(userId, { $pull: { friends: friendId } });
    await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });

    // Delete or update the friendship record
    await Friendship.findOneAndDelete({
      $or: [
        { requester: userId, recipient: friendId },
        { requester: friendId, recipient: userId },
      ],
      status: "accepted",
    });

    res.status(200).json({ message: "Friend removed" });
  } catch (error) {
    console.error("Error in removeFriend:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

/** Get pending friend requests (incoming) */
export const getPendingRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const requests = await Friendship.find({
      recipient: userId,
      status: "pending",
    }).populate("requester", "fullName username profilePic");

    res.status(200).json(requests);
  } catch (error) {
    console.error("Error in getPendingRequests:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

/** Get friend list */
export const getFriends = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate("friends", "fullName username profilePic");
    res.status(200).json(user.friends || []);
  } catch (error) {
    console.error("Error in getFriends:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
