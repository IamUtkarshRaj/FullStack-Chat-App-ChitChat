import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { formatMessageTime } from "../lib/utils";

// Theme-aware "seen" tick color map
const SEEN_COLORS = {
  light: "#3b82f6",
  dark: "#60a5fa",
  cupcake: "#f472b6",
  bumblebee: "#f59e0b",
  emerald: "#10b981",
  corporate: "#2563eb",
  synthwave: "#e879f9",
  retro: "#f97316",
  cyberpunk: "#06b6d4",
  valentine: "#ec4899",
  halloween: "#f97316",
  garden: "#22c55e",
  forest: "#4ade80",
  aqua: "#06b6d4",
  lofi: "#6366f1",
  pastel: "#a78bfa",
  fantasy: "#8b5cf6",
  wireframe: "#3b82f6",
  black: "#60a5fa",
  luxury: "#fbbf24",
  dracula: "#ff79c6",
  cmyk: "#06b6d4",
  autumn: "#ef4444",
  business: "#3b82f6",
  acid: "#84cc16",
  lemonade: "#65a30d",
  night: "#38bdf8",
  coffee: "#d97706",
  winter: "#3b82f6",
  dim: "#818cf8",
  nord: "#88c0d0",
  sunset: "#fb923c",
};

// Tick SVG component for message status
const MessageTicks = ({ status, theme }) => {
  const seenColor = SEEN_COLORS[theme] || "#3b82f6";
  const grayColor = "#9ca3af";

  if (status === "seen") {
    // Double tick, colored
    return (
      <svg width="18" height="12" viewBox="0 0 24 14" className="inline-block ml-1">
        <path d="M1 7l4.5 4.5L14 3" fill="none" stroke={seenColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 7l4.5 4.5L20 3" fill="none" stroke={seenColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === "delivered") {
    // Double tick, gray
    return (
      <svg width="18" height="12" viewBox="0 0 24 14" className="inline-block ml-1">
        <path d="M1 7l4.5 4.5L14 3" fill="none" stroke={grayColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 7l4.5 4.5L20 3" fill="none" stroke={grayColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  // sent — single tick, gray
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" className="inline-block ml-1">
      <path d="M1 7l4.5 4.5L13 3" fill="none" stroke={grayColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

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
  const { theme } = useThemeStore();
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
      const hasUnseen = messages.some(
        (msg) => msg.senderId === selectedUser._id && msg.status !== "seen"
      );
      if (hasUnseen) {
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
                {isSender && !message.pending && (
                  <span className="self-end mt-1 flex items-center">
                    <MessageTicks status={message.status || "sent"} theme={theme} />
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