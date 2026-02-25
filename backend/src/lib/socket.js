import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/message.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

// used to store online users
const userSocketMap = {}; // {userId: socketId}

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // When a user comes online, mark all undelivered messages TO them as "delivered"
  if (userId) {
    (async () => {
      try {
        const result = await Message.updateMany(
          { receiverId: userId, status: "sent" },
          { $set: { status: "delivered" } }
        );
        if (result.modifiedCount > 0) {
          // Find distinct senders whose messages just got delivered
          const msgs = await Message.find({
            receiverId: userId,
            status: "delivered",
          }).distinct("senderId");

          msgs.forEach((senderId) => {
            const senderSocketId = userSocketMap[senderId.toString()];
            if (senderSocketId) {
              io.to(senderSocketId).emit("messagesDelivered", {
                recipientId: userId,
              });
            }
          });
        }
      } catch (err) {
        console.error("Error marking messages as delivered on connect:", err);
      }
    })();
  }

  // SOCKET EVENT TO MARK MESSAGES AS SEEN
  socket.on("markSeen", async ({ senderId, receiverId }) => {
    try {
      await Message.updateMany(
        { senderId, receiverId, status: { $ne: "seen" } },
        { $set: { status: "seen" } }
      );
      // Notify sender that messages are seen
      const senderSocketId = userSocketMap[senderId];
      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesSeen", { byUserId: receiverId });
      }
      // Notify receiver to clear unread count in sidebar
      const receiverSocketId = userSocketMap[receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("unreadCountUpdate", {
          senderId,
          unreadCount: 0,
        });
      }
    } catch (error) {
      console.error("Error updating seen status via socket:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };