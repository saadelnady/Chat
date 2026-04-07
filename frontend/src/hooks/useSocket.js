import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

export default function useSocket(user, selectedSellerId = null) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [targetScrollMessageId, setTargetScrollMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef(null);
  const isWindowFocused = useRef(true);
  const notificationSound = useRef(
    new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3",
    ),
  );

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

  const clearNotifications = () => setNotifications([]);

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  useEffect(() => {
    if (!user) return;

    socketRef.current = io("http://localhost:3000"); // Updated to 3001 as per server console

    socketRef.current.on("connect", () => {
      setIsConnected(true);
      socketRef.current.emit("user_connected", user.id);
    });

    socketRef.current.on("disconnect", () => {
      setIsConnected(false);
    });

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

    const triggerAlert = (data) => {
      if (data.author === user.username) return;

      notificationSound.current
        .play()
        .catch((e) => console.log("Sound error:", e));

      const isCurrentlyViewing =
        data.room === currentRoom && isWindowFocused.current;

      if (!isCurrentlyViewing) {
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

    socketRef.current.on("new_notification", (data) => {
      if (data.room !== currentRoom) {
        triggerAlert(data);
      }
    });

    socketRef.current.on("online_users", (users) => {
      setOnlineUsers(users);
    });

    socketRef.current.on("user_typing", (data) => {
      if (data.isTyping) {
        setTypingUser(data.username);
      } else {
        setTypingUser(null);
      }
    });

    if (currentRoom) {
      socketRef.current.emit("receive_message", { room: currentRoom });
    }

    return () => {
      socketRef.current.disconnect();
    };
  }, [user, selectedSellerId]);

  const sendTypingStatus = (isTyping) => {
    const roomName =
      user.role === "seller"
        ? `seller_${user.id}`
        : selectedSellerId
          ? `seller_${selectedSellerId}`
          : null;
    if (!roomName || !socketRef.current) return;
    socketRef.current.emit(isTyping ? "typing" : "stop_typing", {
      room: roomName,
      username: user.username,
    });
  };

  const sendMessage = (fileData = null) => {
    if (!message.trim() && !fileData) return;
    const roomName =
      user.role === "seller"
        ? `seller_${user.id}`
        : selectedSellerId
          ? `seller_${selectedSellerId}`
          : null;
    if (!roomName) return;

    const msgData = {
      room: roomName,
      message: message.trim() || "",
      author: user.username,
      role: user.role,
      timestamp: new Date().toISOString(),
      ...fileData, // Spread fileUrl, fileName, fileType if present
    };

    socketRef.current.emit("send_message", msgData);
    sendTypingStatus(false);
    setMessage("");
  };

  useEffect(() => {
    if (!targetScrollMessageId && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, targetScrollMessageId]);

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
  };
}
