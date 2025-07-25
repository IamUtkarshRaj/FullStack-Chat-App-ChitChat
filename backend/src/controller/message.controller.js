import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// Updated getUsersForSidebar to include unread message counts
export const getUsersForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;

        // Fetch all users except the logged-in user
        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

        // For each user, calculate the count of unread messages sent to the logged-in user
        const usersWithUnread = await Promise.all(
            filteredUsers.map(async (user) => {
                const unreadCount = await Message.countDocuments({
                    senderId: user._id,
                    receiverId: loggedInUserId,
                    isRead: false,
                });
                return {
                    ...user.toObject(),
                    unreadCount,
                };
            })
        );

        res.status(200).json(usersWithUnread);
    } catch (error) {
        console.error("Error in getUsersForSidebar controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getMesssage = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId }
            ],
        });
        res.status(200).json(messages);
    } catch (error) {
        console.error("Error in getMesssage controller:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const sendMesssage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      isRead: false,
    });

    await newMessage.save();

    // Emit real-time message
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);

      const unreadCount = await Message.countDocuments({
        senderId,
        receiverId,
        isRead: false,
      });
      io.to(receiverSocketId).emit("unreadCountUpdate", {
        senderId,
        unreadCount,
      });
    }

    // Also emit to the sender so their chat updates instantly
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendMesssage controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// NEW FUNCTION TO MARK MESSAGES AS READ
export const markMessagesAsRead = async (req, res) => {
  try {
    const { senderId } = req.body;
    const userId = req.user._id;

    await Message.updateMany(
      { senderId, receiverId: userId, isRead: false },
      { $set: { isRead: true } }
    );

    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesRead", { receiverId: userId });
    }

    // Notify the current user to update their sidebar
    const currentSocketId = getReceiverSocketId(userId);
    if (currentSocketId) {
      io.to(currentSocketId).emit("unreadCountUpdate", {
        senderId,
        unreadCount: 0,
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in markMessagesAsRead:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};