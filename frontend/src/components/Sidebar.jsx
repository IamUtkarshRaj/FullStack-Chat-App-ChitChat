import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useFriendStore } from "../store/useFriendStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import AddFriendModal from "./AddFriendModal";
import { Users, UserPlus } from "lucide-react";

// Animated badge component for smooth counter transitions
const UnreadBadge = ({ count }) => {
  if (count <= 0) return null;
  return (
    <span
      className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1
        animate-[badgePop_0.3s_ease-out]"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
};

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const { pendingRequests, getPendingRequests, subscribeFriendEvents, unsubscribeFriendEvents } = useFriendStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);

  useEffect(() => {
    getUsers();
    getPendingRequests();
    subscribeFriendEvents();
    return () => unsubscribeFriendEvents();
  }, [getUsers, getPendingRequests, subscribeFriendEvents, unsubscribeFriendEvents]);

  let filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="size-6" />
            <span className="font-medium hidden lg:block">Friends</span>
          </div>
          <button
            className="btn btn-sm btn-ghost btn-circle relative"
            onClick={() => setShowAddFriend(true)}
            title="Add Friends"
          >
            <UserPlus className="size-5" />
            {pendingRequests.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-content text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-0.5 animate-[badgePop_0.3s_ease-out]">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">
            ({users.filter((u) => onlineUsers.includes(u._id)).length} online)
          </span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {filteredUsers.map((user) => (
          <button
            key={user._id}
            onClick={() => setSelectedUser(user)}
            className={`
              w-full p-3 flex items-center gap-3
              hover:bg-base-300 transition-colors
              ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
            `}
          >
            <div className="relative mx-auto lg:mx-0">
              <img
                src={user.profilePic || "/avatar.png"}
                alt={user.name}
                className="size-12 object-cover rounded-full"
              />
              {onlineUsers.includes(user._id) && (
                <span
                  className="absolute bottom-0 right-0 size-3 bg-green-500 
                  rounded-full ring-2 ring-zinc-900"
                />
              )}
              <span className="absolute -top-1 -right-1">
                <UnreadBadge count={user.unreadCount || 0} />
              </span>
            </div>

            <div className="hidden lg:block text-left min-w-0">
              <div className="font-medium truncate flex items-center gap-2">
                {user.fullName}
              </div>
              <div className="text-sm text-zinc-400">
                {onlineUsers.includes(user._id) ? "Online" : "Offline"}
              </div>
            </div>
          </button>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4 px-2">
            <Users className="size-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">
              {showOnlineOnly ? "No friends online" : "No friends yet"}
            </p>
            {!showOnlineOnly && (
              <button
                className="btn btn-sm btn-primary mt-2 gap-1"
                onClick={() => setShowAddFriend(true)}
              >
                <UserPlus className="size-4" /> Add Friends
              </button>
            )}
          </div>
        )}
      </div>

      <AddFriendModal isOpen={showAddFriend} onClose={() => setShowAddFriend(false)} />
    </aside>
  );
};
export default Sidebar;