import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { useChatStore } from "./useChatStore";

export const useFriendStore = create((set, get) => ({
  friends: [],
  pendingRequests: [],
  searchResults: [],
  isSearching: false,
  isLoading: false,

  /** Search users by username or name */
  searchUsers: async (query) => {
    if (!query || query.trim().length < 2) {
      set({ searchResults: [] });
      return;
    }
    set({ isSearching: true });
    try {
      const res = await axiosInstance.get(`/friends/search?q=${encodeURIComponent(query)}`);
      set({ searchResults: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Search failed");
    } finally {
      set({ isSearching: false });
    }
  },

  /** Clear search results */
  clearSearch: () => set({ searchResults: [] }),

  /** Send a friend request */
  sendRequest: async (recipientId) => {
    try {
      const res = await axiosInstance.post("/friends/request", { recipientId });
      toast.success(res.data.message);

      // Update search results to reflect pending state
      set({
        searchResults: get().searchResults.map((user) =>
          user._id === recipientId
            ? {
                ...user,
                friendship: {
                  status: "pending",
                  isSender: true,
                  friendshipId: res.data.friendship._id,
                },
              }
            : user
        ),
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send request");
    }
  },

  /** Accept a friend request */
  acceptRequest: async (friendshipId) => {
    try {
      await axiosInstance.put(`/friends/accept/${friendshipId}`);
      toast.success("Friend request accepted!");

      // Remove from pending, refresh friends & sidebar
      set({
        pendingRequests: get().pendingRequests.filter(
          (req) => req._id !== friendshipId
        ),
      });

      // Refresh friends list and sidebar
      await Promise.all([get().getFriends(), useChatStore.getState().getUsers()]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to accept request");
    }
  },

  /** Reject a friend request */
  rejectRequest: async (friendshipId) => {
    try {
      await axiosInstance.put(`/friends/reject/${friendshipId}`);
      toast.success("Friend request rejected");

      set({
        pendingRequests: get().pendingRequests.filter(
          (req) => req._id !== friendshipId
        ),
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject request");
    }
  },

  /** Remove a friend */
  removeFriend: async (friendId) => {
    try {
      await axiosInstance.delete(`/friends/remove/${friendId}`);
      toast.success("Friend removed");

      set({
        friends: get().friends.filter((f) => f._id !== friendId),
      });

      // Refresh sidebar users
      useChatStore.getState().getUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove friend");
    }
  },

  /** Fetch friend list */
  getFriends: async () => {
    set({ isLoading: true });
    try {
      const res = await axiosInstance.get("/friends/list");
      set({ friends: res.data });
    } catch (error) {
      console.error("Failed to load friends:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  /** Fetch pending incoming requests */
  getPendingRequests: async () => {
    try {
      const res = await axiosInstance.get("/friends/requests");
      set({ pendingRequests: res.data });
    } catch (error) {
      console.error("Failed to load pending requests:", error);
    }
  },

  /** Subscribe to friend-related socket events */
  subscribeFriendEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.off("friendRequestReceived");
    socket.off("friendRequestAccepted");

    // Someone sent us a friend request
    socket.on("friendRequestReceived", ({ friendshipId, requester }) => {
      toast(`${requester.fullName} sent you a friend request!`, { icon: "👋" });

      // Add to pending requests
      set({
        pendingRequests: [
          ...get().pendingRequests,
          { _id: friendshipId, requester, status: "pending" },
        ],
      });
    });

    // Our sent request was accepted
    socket.on("friendRequestAccepted", ({ friendshipId, acceptedBy }) => {
      toast.success(`${acceptedBy.fullName} accepted your friend request!`);

      // Refresh friends list and sidebar
      get().getFriends();
      useChatStore.getState().getUsers();
    });
  },

  /** Unsubscribe from friend socket events */
  unsubscribeFriendEvents: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("friendRequestReceived");
    socket.off("friendRequestAccepted");
  },
}));
