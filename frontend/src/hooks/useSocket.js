import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

export default function useSocket(user, selectedSellerId = null) {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);
  const [notifications, setNotifications] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  
  const socketRef = useRef(null);
  const isWindowFocused = useRef(true);

  // تتبع تركيز الصفحة
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

  useEffect(() => {
    if (!user) return;

    socketRef.current = io("http://localhost:3000");

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

    socketRef.current.on("receive_message", (data) => {
      if (Array.isArray(data)) {
        setMessages(data);
      } else {
        if (data.room === currentRoom) {
          setMessages((prev) => [...prev, data]);
        }

        if (data.author !== user.username) {
          // نستخدم الـ ref هنا عشان نمنع الـ re-connection
          const isInCurrentActiveChat = data.room === currentRoom && isWindowFocused.current;

          if (!isInCurrentActiveChat) {
            if (Notification.permission === "granted") {
              new Notification(`رسالة جديدة من ${data.author}`, {
                body: data.message,
                icon: "/chat-icon.png",
              });
            }

            setNotifications((prev) => [
              { id: Date.now(), author: data.author, message: data.message, timestamp: data.timestamp, room: data.room },
              ...prev,
            ]);
          }
        }
      }
    });

    socketRef.current.on("online_users", (users) => {
      setOnlineUsers(users);
    });

    socketRef.current.emit("user_connected", user.id);

    if (currentRoom) {
      socketRef.current.emit("receive_message", { room: currentRoom });
    }

    return () => {
      socketRef.current.disconnect();
    };
  }, [user, selectedSellerId]); // شلنا isWindowFocused من هنا عشان ميعملش ريكونكت

  const sendMessage = () => {
    if (!message.trim()) return;
    const roomName =
      user.role === "seller"
        ? `seller_${user.id}`
        : selectedSellerId
          ? `seller_${selectedSellerId}`
          : null;
    if (!roomName) return;

    const msgData = {
      room: roomName,
      message,
      author: user.username,
      role: user.role,
      timestamp: new Date().toISOString(),
    };

    socketRef.current.emit("send_message", msgData);
    setMessage("");
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return {
    messages,
    message,
    setMessage,
    sendMessage,
    messagesEndRef,
    notifications,
    clearNotifications,
    onlineUsers,
  };
}
