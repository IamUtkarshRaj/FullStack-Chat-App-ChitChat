import { useState, useEffect, useRef } from "react";
import { useFriendStore } from "../store/useFriendStore";
import { Search, X, UserPlus, Clock, Check, XCircle, Users, Loader2 } from "lucide-react";

const AddFriendModal = ({ isOpen, onClose }) => {
  const {
    searchResults,
    isSearching,
    pendingRequests,
    searchUsers,
    clearSearch,
    sendRequest,
    acceptRequest,
    rejectRequest,
    getPendingRequests,
  } = useFriendStore();

  const [activeTab, setActiveTab] = useState("search");
  const [searchQuery, setSearchQuery] = useState("");
  const searchTimerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      getPendingRequests();
    }
    return () => {
      clearSearch();
      setSearchQuery("");
      setActiveTab("search");
    };
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (searchQuery.trim().length >= 2) {
      searchTimerRef.current = setTimeout(() => {
        searchUsers(searchQuery);
      }, 350);
    } else {
      clearSearch();
    }
    return () => clearTimeout(searchTimerRef.current);
  }, [searchQuery]);

  if (!isOpen) return null;

  const renderFriendshipButton = (user) => {
    const f = user.friendship;

    if (f?.status === "accepted") {
      return (
        <span className="btn btn-sm btn-ghost text-success gap-1 pointer-events-none">
          <Check className="size-4" /> Friends
        </span>
      );
    }

    if (f?.status === "pending" && f.isSender) {
      return (
        <span className="btn btn-sm btn-ghost text-warning gap-1 pointer-events-none">
          <Clock className="size-4" /> Pending
        </span>
      );
    }

    if (f?.status === "pending" && !f.isSender) {
      return (
        <div className="flex gap-1">
          <button
            className="btn btn-sm btn-success gap-1"
            onClick={() => acceptRequest(f.friendshipId)}
          >
            <Check className="size-3" /> Accept
          </button>
          <button
            className="btn btn-sm btn-error gap-1"
            onClick={() => rejectRequest(f.friendshipId)}
          >
            <X className="size-3" />
          </button>
        </div>
      );
    }

    return (
      <button
        className="btn btn-sm btn-primary gap-1"
        onClick={() => sendRequest(user._id)}
      >
        <UserPlus className="size-4" /> Add
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-base-100 rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <h3 className="font-semibold text-lg">Add Friends</h3>
          <button className="btn btn-sm btn-ghost btn-circle" onClick={onClose}>
            <X className="size-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-bordered px-4 pt-2">
          <button
            className={`tab ${activeTab === "search" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("search")}
          >
            <Search className="size-4 mr-1" /> Search
          </button>
          <button
            className={`tab ${activeTab === "requests" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("requests")}
          >
            <UserPlus className="size-4 mr-1" /> Requests
            {pendingRequests.length > 0 && (
              <span className="badge badge-sm badge-primary ml-1">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "search" && (
            <div>
              {/* Search Input */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search by @username or name..."
                  className="input input-bordered w-full pl-10 pr-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                {searchQuery && (
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="size-4 text-zinc-400" />
                  </button>
                )}
              </div>

              {/* Results */}
              {isSearching && (
                <div className="flex justify-center py-6">
                  <Loader2 className="size-6 animate-spin text-primary" />
                </div>
              )}

              {!isSearching && searchResults.length === 0 && searchQuery.length >= 2 && (
                <div className="text-center text-zinc-500 py-6">
                  <Users className="size-10 mx-auto mb-2 opacity-40" />
                  No users found
                </div>
              )}

              {!isSearching && searchQuery.length < 2 && searchResults.length === 0 && (
                <div className="text-center text-zinc-500 py-6">
                  <Search className="size-10 mx-auto mb-2 opacity-40" />
                  Type at least 2 characters to search
                </div>
              )}

              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-base-200 transition-colors"
                  >
                    <img
                      src={user.profilePic || "/avatar.png"}
                      alt={user.fullName}
                      className="size-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{user.fullName}</div>
                      <div className="text-xs text-zinc-400">@{user.username}</div>
                    </div>
                    {renderFriendshipButton(user)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "requests" && (
            <div>
              {pendingRequests.length === 0 ? (
                <div className="text-center text-zinc-500 py-6">
                  <UserPlus className="size-10 mx-auto mb-2 opacity-40" />
                  No pending requests
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingRequests.map((request) => (
                    <div
                      key={request._id}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-base-200 transition-colors"
                    >
                      <img
                        src={request.requester.profilePic || "/avatar.png"}
                        alt={request.requester.fullName}
                        className="size-10 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {request.requester.fullName}
                        </div>
                        <div className="text-xs text-zinc-400">
                          @{request.requester.username}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          className="btn btn-sm btn-success gap-1"
                          onClick={() => acceptRequest(request._id)}
                        >
                          <Check className="size-3" /> Accept
                        </button>
                        <button
                          className="btn btn-sm btn-error btn-outline gap-1"
                          onClick={() => rejectRequest(request._id)}
                        >
                          <XCircle className="size-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddFriendModal;
