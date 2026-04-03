// hooks/useSocket.js
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

export default function useSocket(user) {
  const [messages, setMessages] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [onlineSellers, setOnlineSellers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [socketInstance, setSocketInstance] = useState(null);
  const currentRoomRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("token");
    const socket = io("http://localhost:3001", { auth: { token } });
    setSocketInstance(socket);

    socket.on("connect", () => socket.emit("join_room"));

    socket.on("load_messages", setMessages);

    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);

      if (user.role === "admin") {
        const room = msg.room;
        if (room !== currentRoomRef.current) {
          setUnreadCounts((prev) => ({
            ...prev,
            [room]: (prev[room] || 0) + 1,
          }));
        }
      }
    });

    if (user.role === "admin") {
      socket.on("load_sellers", setSellers);
      socket.on("load_online_sellers", setOnlineSellers);

      socket.on("seller_online", ({ seller }) => {
        setOnlineSellers((prev) =>
          prev.includes(seller) ? prev : [...prev, seller],
        );
      });

      socket.on("seller_offline", ({ seller }) => {
        setOnlineSellers((prev) => prev.filter((s) => s !== seller));
      });
    }

    return () => socket.disconnect();
  }, [user]);

  return {
    messages,
    setMessages,
    sellers,
    onlineSellers,
    unreadCounts,
    setUnreadCounts,
    currentRoomRef,
    socket: socketInstance,
  };
}
