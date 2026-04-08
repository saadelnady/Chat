import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

// --- Constants ---
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";
const NOTIFICATION_SOUND_URL =
  "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3";

export default function useSocket(user, selectedSellerId = null) {
  // --- State: Messages & Chat UI ---
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [targetScrollMessageId, setTargetScrollMessageId] = useState(null);
  const [typingUser, setTypingUser] = useState(null);

  // --- State: Notifications & Users ---
  const [notifications, setNotifications] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // --- State: Connection Status ---
  const [isConnected, setIsConnected] = useState(false);

  // --- Refs ---
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isWindowFocused = useRef(true);
  const notificationSound = useRef(new Audio(NOTIFICATION_SOUND_URL));

  // --- Effect: Window Focus Listeners ---
  useEffect(() => {
    const onFocus = () => (isWindowFocused.current = true);
    const onBlur = () => (isWindowFocused.current = false);

    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  // --- Effect: Socket Initialization & Listeners ---
  useEffect(() => {
    if (!user) return;

    // Initialize Socket
    socketRef.current = io(API_URL);

    // 1. Connection Handlers
    socketRef.current.on("connect", () => {
      setIsConnected(true);
      socketRef.current.emit("user_connected", user.id);
      socketRef.current.emit("get_unread_notifications", {
        userId: user.id,
        role: user.role,
      });
    });

    socketRef.current.on("disconnect", () => {
      setIsConnected(false);
    });

    // 2. Room Management
    const currentRoom =
      user.role === "seller"
        ? `seller_${user.id}`
        : selectedSellerId
          ? `seller_${selectedSellerId}`
          : null;

    if (currentRoom) {
      socketRef.current.emit("join_room", currentRoom);
    }

    if (user.role === "admin") {
      socketRef.current.emit("join_room", "admins_notifications");
    }

    // 3. Helper: Trigger Notifications
    const triggerAlert = (data) => {
      if (data.author === user.username) return;

      // Play Sound
      notificationSound.current
        .play()
        .catch((e) => console.log("Sound error:", e));

      const isCurrentlyViewing =
        data.room === currentRoom && isWindowFocused.current;

      if (!isCurrentlyViewing) {
        // Browser Notification
        if (Notification.permission === "granted") {
          const bodyText = data.fileUrl
            ? data.fileType === "image"
              ? "📷 صورة جديدة"
              : "📁 ملف جديد"
            : data.message;

          new Notification(`رسالة جديدة من ${data.author}`, {
            body: bodyText,
            icon: "/chat-icon.png",
          });
        }

        // App Notification List
        setNotifications((prev) => [
          {
            id: data._id || Date.now(),
            author: data.author,
            message: data.fileUrl
              ? data.fileType === "image"
                ? "📷 صورة"
                : `📁 ${data.fileName}`
              : data.message,
            timestamp: data.timestamp,
            room: data.room,
          },
          ...prev,
        ]);
      }
    };

    // 4. Message Listeners
    socketRef.current.on("receive_message", (data) => {
      if (Array.isArray(data)) {
        setMessages(data);
      } else {
        if (data.room === currentRoom) {
          setMessages((prev) => [...prev, data]);
          triggerAlert(data);
        }
      }
    });

    // 5. Notification & Status Listeners
    socketRef.current.on("new_notification", (data) => {
      if (data.room !== currentRoom) {
        triggerAlert(data);
      }
    });

    socketRef.current.on("online_users", (users) => {
      setOnlineUsers(users);
    });

    socketRef.current.on("user_typing", (data) => {
      setTypingUser(data.isTyping ? data.username : null);
    });

    socketRef.current.on("initial_notifications", (messages) => {
      const formattedNotifs = messages.map((m) => ({
        id: m._id,
        author: m.author,
        message: m.fileUrl
          ? m.fileType === "image"
            ? "📷 صورة"
            : `📁 ${m.fileName}`
          : m.message,
        timestamp: m.timestamp,
        room: m.room,
      }));
      setNotifications(formattedNotifs);
    });

    // 6. Initial Request for Messages
    if (currentRoom) {
      socketRef.current.emit("receive_message", { room: currentRoom });
    }
    socketRef.current.on("edit_message", (data) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === data._id ? data : m)),
      );
    });

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user, selectedSellerId]);

  // --- Effect: Auto-Scroll Logic ---
  useEffect(() => {
    if (!targetScrollMessageId && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, targetScrollMessageId]);

  // --- Actions & Helpers ---
  const clearNotifications = () => setNotifications([]);

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAsRead = (messageId) => {
    if (socketRef.current) {
      socketRef.current.emit("mark_as_read", messageId);
    }
  };

  const getTargetRoom = () => {
    return user.role === "seller"
      ? `seller_${user.id}`
      : selectedSellerId
        ? `seller_${selectedSellerId}`
        : null;
  };

  const sendTypingStatus = (isTyping) => {
    const roomName = getTargetRoom();
    if (!roomName || !socketRef.current) return;

    socketRef.current.emit(isTyping ? "typing" : "stop_typing", {
      room: roomName,
      username: user.username,
    });
  };

  const sendMessage = (fileData = null) => {
    if (!message.trim() && !fileData) return;

    const roomName = getTargetRoom();
    if (!roomName) return;

    const msgData = {
      room: roomName,
      message: message.trim() || "",
      author: user.username,
      role: user.role,
      timestamp: new Date().toISOString(),
      ...fileData,
    };

    socketRef.current.emit("send_message", msgData);
    sendTypingStatus(false);
    setMessage("");
  };

  // --- Return Hook Methods ---
  return {
    messages,
    message,
    setMessage,
    sendMessage,
    messagesEndRef,
    notifications,
    clearNotifications,
    removeNotification,
    onlineUsers,
    typingUser,
    isConnected,
    sendTypingStatus,
    targetScrollMessageId,
    setTargetScrollMessageId,
    markAsRead,
  };
}
