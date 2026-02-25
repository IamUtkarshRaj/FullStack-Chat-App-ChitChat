import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import imageCompression from "browser-image-compression";

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isImageSending: false,

  /** Fetch all users for sidebar */
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  /** Fetch messages with a specific user */
  getMessages: async (userId) => {
    if (!userId) return;
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  /** Mark messages as seen */
  markMessagesAsRead: async (senderId) => {
    try {
      await axiosInstance.post("/messages/seen", { senderId });

      set({
        messages: get().messages.map((msg) =>
          msg.senderId === senderId ? { ...msg, status: "seen" } : msg
        ),
      });

      // Notify server via socket
      const socket = useAuthStore.getState().socket;
      const authUser = useAuthStore.getState().authUser;
      socket.emit("markSeen", { senderId, receiverId: authUser._id });
    } catch (error) {
      console.error("Failed to mark messages as seen", error);
    }
  },

  /** Send a text message */
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    if (!selectedUser) return;

    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  /** Compress and send an image */
  sendImage: async (imageFile) => {
    const { selectedUser, messages } = get();
    if (!imageFile || !selectedUser) return;
    set({ isImageSending: true });

    if (imageFile.size > 2 * 1024 * 1024) {
      toast("Image is very large, sending may take time.", { icon: "⚠️" });
    }

    toast.loading("Compressing and sending image...");

    const options = {
      maxSizeMB: 0.2,
      maxWidthOrHeight: 800,
      useWebWorker: true,
      fileType: "image/jpeg",
      initialQuality: 0.6,
    };

    let tempMessage = null;
    try {
      let base64Image;
      if (imageFile.size < 200 * 1024) {
        base64Image = await toBase64(imageFile);
      } else {
        const compressedFile = await imageCompression(imageFile, options);
        base64Image = await toBase64(compressedFile);
      }

      // Optimistic UI update
      tempMessage = {
        image: base64Image,
        senderId: useAuthStore.getState().authUser._id,
        _id: `temp-${Date.now()}`,
        pending: true,
        createdAt: new Date().toISOString(),
      };
      set({ messages: [...messages, tempMessage] });

      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, { image: base64Image });

      set({
        messages: [
          ...get().messages.filter((msg) => msg._id !== tempMessage._id),
          res.data,
        ],
      });
    } catch (error) {
      toast.error("Failed to send image.");
      if (tempMessage) {
        set({ messages: get().messages.filter((msg) => msg._id !== tempMessage._id) });
      }
    } finally {
      set({ isImageSending: false });
      toast.dismiss();
    }
  },

  /** Subscribe to real-time messages via socket */
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;

    // Remove old listeners
    socket.off("newMessage");
    socket.off("messagesDelivered");
    socket.off("messagesSeen");
    socket.off("unreadCountUpdate");

    // New message event
    socket.on("newMessage", (newMessage) => {
      const { selectedUser, messages } = get();

      if (
        selectedUser &&
        (newMessage.senderId === selectedUser._id ||
          newMessage.receiverId === selectedUser._id)
      ) {
        // Avoid duplicates (sender also gets the event)
        const isDuplicate = messages.some((m) => m._id === newMessage._id);
        if (!isDuplicate) {
          set({ messages: [...messages, newMessage] });
        }

        // If we're the receiver and the chat is open, mark as seen immediately
        if (newMessage.senderId === selectedUser._id) {
          get().markMessagesAsRead(selectedUser._id);
        }
      } else {
        // Not in the chat — increment unread for sender in sidebar
        set({
          users: get().users.map((user) =>
            user._id === newMessage.senderId
              ? { ...user, unreadCount: (user.unreadCount || 0) + 1 }
              : user
          ),
        });
      }
    });

    // Messages delivered event — sender sees double tick
    socket.on("messagesDelivered", ({ recipientId }) => {
      set({
        messages: get().messages.map((msg) =>
          msg.receiverId === recipientId && msg.status === "sent"
            ? { ...msg, status: "delivered" }
            : msg
        ),
      });
    });

    // Messages seen event — sender sees colored double tick
    socket.on("messagesSeen", ({ byUserId }) => {
      set({
        messages: get().messages.map((msg) =>
          msg.receiverId === byUserId && msg.status !== "seen"
            ? { ...msg, status: "seen" }
            : msg
        ),
      });
    });

    // Unread count sync for sidebar
    socket.on("unreadCountUpdate", ({ senderId, unreadCount }) => {
      set({
        users: get().users.map((user) =>
          user._id === senderId ? { ...user, unreadCount } : user
        ),
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("messagesDelivered");
    socket.off("messagesSeen");
    socket.off("unreadCountUpdate");
  },

  /** Set current chat user */
  setSelectedUser: async (selectedUser) => {
    set({ selectedUser });

    if (selectedUser) {
      // Clear unread count in sidebar immediately for smooth UX
      set({
        users: get().users.map((user) =>
          user._id === selectedUser._id ? { ...user, unreadCount: 0 } : user
        ),
      });

      // Mark as seen on server, fetch messages in parallel
      await Promise.all([
        get().markMessagesAsRead(selectedUser._id),
        get().getMessages(selectedUser._id),
      ]);
    }
  },
}));
