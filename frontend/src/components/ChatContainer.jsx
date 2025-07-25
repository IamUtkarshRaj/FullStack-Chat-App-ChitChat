import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    markMessagesAsRead,
  } = useChatStore();

  const { authUser } = useAuthStore();
  const scrollRef = useRef(null);

  const [modalImage, setModalImage] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch messages and subscribe to socket events
  useEffect(() => {
    if (!selectedUser?._id) return;

    getMessages(selectedUser._id);
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser?._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  // Mark messages as read when chat is open
  useEffect(() => {
    if (selectedUser?._id) {
      const hasUnread = messages.some(
        (msg) => msg.senderId === selectedUser._id && !msg.isRead
      );
      if (hasUnread) {
        markMessagesAsRead(selectedUser._id);
      }
    }
  }, [messages, selectedUser?._id, markMessagesAsRead]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // Handle ESC key for closing modal
  useEffect(() => {
    if (!showModal) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowModal(false);
        setTimeout(() => setModalImage(null), 300);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showModal]);

  const modalBgClass = showModal ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none";
  const modalImgClass = showModal ? "scale-100 opacity-100" : "scale-90 opacity-0";

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      {/* Image Modal */}
      {modalImage && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 transition-opacity duration-300 ${modalBgClass}`}
          onClick={() => {
            setShowModal(false);
            setTimeout(() => setModalImage(null), 300);
          }}
        >
          <img
            src={modalImage}
            alt="Full view"
            className={`max-h-[80vh] max-w-[90vw] rounded-lg shadow-2xl transition-all duration-300 ${modalImgClass}`}
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((message) => {
          const isSender = message.senderId === authUser._id;
          return (
            <div
              key={message._id}
              className={`chat ${isSender ? "chat-end" : "chat-start"}`}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      isSender
                        ? authUser.profilePic || "/avatar.png"
                        : selectedUser.profilePic || "/avatar.png"
                    }
                    alt="profile pic"
                  />
                </div>
              </div>

              <div className="chat-header mb-1">
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>

              <div className="chat-bubble flex flex-col relative">
                {message.image && (
                  <div className="relative">
                    <img
                      src={message.image}
                      alt="Attachment"
                      className={`sm:max-w-[200px] rounded-md mb-2 cursor-pointer transition-transform duration-200 hover:scale-105 ${
                        message.pending ? "opacity-60" : ""
                      }`}
                      onClick={() => {
                        setModalImage(message.image);
                        setShowModal(true);
                      }}
                    />
                    {message.pending && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-md">
                        <Loader2 className="animate-spin text-emerald-500" size={32} />
                      </div>
                    )}
                  </div>
                )}
                {message.text && <p>{message.text}</p>}
                {isSender && (
                  <span className="text-[10px] text-gray-400 self-end mt-1">
                    {message.isRead ? "✓✓" : "✓"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <MessageInput />
    </div>
  );
};
export default ChatContainer;