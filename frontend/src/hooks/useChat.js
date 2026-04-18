import { useEffect, useRef, useState } from "react";
import { socket } from "../socket";
import { uploadFile } from "../api/upload";
import { getRoom } from "../helpers/helpers";

const useChat = (user) => {
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const audioRef = useRef(null);
  const lastTypingTimeRef = useRef(0);

  const [messages, setMessages] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [onlineUsersList, setOnlineUsersList] = useState([]);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const [notifications, setNotifications] = useState([]);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loadingSellers, setLoadingSellers] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [lastSeenMap, setLastSeenMap] = useState({});

  useEffect(() => {
    socketRef.current = socket;

    const join = () => {
      if (user) {
        socketRef.current.emit("register_user", {
          userId: user._id,
          role: user.role,
        });

        const roomId = getRoom(user, selectedSeller);
        if (roomId) {
          socketRef.current.emit("join_room", roomId);
          socketRef.current.emit("get_messages", roomId);
        }

        if (user.role === "admin") {
          socketRef.current.emit("join_room", "admins_room");
          socketRef.current.emit("get_unread_messages_counts");
        }
      }
    };

    if (socketRef.current.connected) {
      join();
    } else {
      socketRef.current.on("connect", join);
    }
    return () => {
      socketRef.current.off("connect", join);
    };
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    socketRef.current.on("get_online_users", (users) => {
      setOnlineUsersList(users);
    });

    return () => {
      socketRef.current.off("get_online_users");
    };
  }, []);

  useEffect(() => {
    socketRef.current.on("receive_message", (data) => {
      const currentRoomId = getRoom(user, selectedSeller);

      if (data.room === currentRoomId) {
        setMessages((prev) => [...prev, data]);
        if (data.author !== user.username) {
          socketRef.current.emit("mark_messages_read", data.room);
        }
      }
    });

    return () => socketRef.current.off("receive_message");
  }, [selectedSeller, user]);

  useEffect(() => {
    if (user && user.role === "admin") {
      socketRef.current.emit("admin_logged_in");

      socketRef.current.on("sellers_list", (data) => {
        setSellers(data);
        setLoadingSellers(false);

        // ملء خريطة آخر ظهور من بيانات البائعين
        const seenMap = {};
        data.forEach((seller) => {
          if (seller.lastSeen) {
            seenMap[seller._id] = seller.lastSeen;
          }
        });
        setLastSeenMap((prev) => ({ ...prev, ...seenMap }));
      });
    }

    return () => {
      socketRef.current.off("sellers_list");
    };
  }, [user]);

  useEffect(() => {
    socketRef.current.on("messages_history", (messages) => {
      setMessages(messages);
    });

    return () => {
      socketRef.current.off("messages_history");
    };
  }, []);

  useEffect(() => {
    socketRef.current.on("new_notification", (data) => {
      const isChattingWithThisSeller =
        selectedSeller?._id === data.room.replace("seller_", "");
      //  if admin is not open seller chat
      if (user.role === "admin" && !isChattingWithThisSeller) {
        setNotifications((prev) => [...prev, data]);
        const notification = new Notification(`📩 ${data.author}`, {
          body: data.message,
          silent: true,
        });

        playNotificationSound();
        notification.onclick = () => {
          window.focus();

          const sellerId = data.room.replace("seller_", "");
          const seller = sellers.find((s) => s._id === sellerId);

          if (seller) {
            handleSelectSeller(seller);
          }
        };
      }
      // 🔔 Browser Notification
    });
    socketRef.current.on("new_user_registered", (newUser) => {
      if (user.role === "admin" && newUser.role === "seller") {
        setSellers((prev) => {
          // تأكد إن البائع مش موجود في القائمة بالفعل
          if (prev.some((s) => s._id === newUser._id)) return prev;
          return [...prev, newUser];
        });

        if (Notification.permission === "granted") {
          new Notification(`🎉 New Seller!`, {
            body: `${newUser.username} has just joined the platform.`,
            silent: true,
          });
        }
        playNotificationSound();
        setNotifications((prev) => [
          ...prev,
          { type: "new_seller", seller: newUser, _id: Date.now() },
        ]);
      }
    });

    return () => {
      socketRef.current.off("new_notification");
      socketRef.current.off("new_user_registered");
    };
  }, [selectedSeller, user, sellers]);

  useEffect(() => {
    socketRef.current.on("display_typing", (data) => {
      const currentRoomId = data.room.replace("seller_", "");

      if (
        currentRoomId.toString() === selectedSeller?._id?.toString() ||
        currentRoomId.toString() === user?._id?.toString()
      ) {
        setIsOtherTyping(true);
        setTypingUser(data.username);
      }
    });

    return () => socketRef.current.off("display_typing");
  }, [selectedSeller, user]);

  useEffect(() => {
    socketRef.current.on("display_stop_typing", (data) => {
      const currentRoomId = data.room.replace("seller_", "");

      if (
        currentRoomId.toString() === selectedSeller?._id?.toString() ||
        currentRoomId.toString() === user?._id?.toString()
      ) {
        setIsOtherTyping(false);
        setTypingUser("");
      }
    });

    return () => socketRef.current.off("display_stop_typing");
  }, [selectedSeller, user]);

  useEffect(() => {
    socketRef.current.on("unread_counts_history", (counts) => {
      const initialNotifications = [];

      counts.forEach((item) => {
        for (let i = 0; i < item.count; i++) {
          initialNotifications.push({ room: item._id });
        }
      });
      setNotifications(initialNotifications);
    });

    return () => socketRef.current.off("unread_counts_history");
  }, []);

  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission !== "granted") {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    const audio = new Audio("/notificationSound.wav");
    audio.load();
    audioRef.current = audio;
  }, []);

  const handleFileChange = (files) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setSelectedFiles(fileArray);

    const urls = fileArray.map((file) => {
      if (file.type.startsWith("image/")) {
        return URL.createObjectURL(file);
      }
      return null;
    });
    setPreviewUrls(urls);
    setIsPreviewOpen(true);
  };

  const cancelPreview = () => {
    previewUrls.forEach((url) => {
      if (url) URL.revokeObjectURL(url);
    });
    setSelectedFiles([]);
    setPreviewUrls([]);
    setIsPreviewOpen(false);
    if (document.getElementById("file-upload")) {
      document.getElementById("file-upload").value = "";
    }
  };

  useEffect(() => {
    socketRef.current.on("message_deleted", ({ messageId, room }) => {
      setMessages((prev) =>
        prev.filter((msg) => msg._id.toString() !== messageId.toString()),
      );
    });

    return () => socketRef.current.off("message_deleted");
  }, []);

  // أضف مستمع
  useEffect(() => {
    socketRef.current.on("user_last_seen", ({ userId, lastSeen }) => {
      setLastSeenMap((prev) => ({ ...prev, [userId]: lastSeen }));
    });
    return () => socketRef.current.off("user_last_seen");
  }, []);

  const sendMessage = async () => {
    if (!input.trim() && selectedFiles.length === 0) return;

    const roomId = getRoom(user, selectedSeller);

    if (selectedFiles.length > 0) {
      setIsSending(true);
      setLoadingFiles(true);
      let captionText = input;

      try {
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append("file", file);

          const data = await uploadFile(formData);
          const messageData = {
            author: user.username,
            role: user.role,
            message: captionText, // أرسل النص مع أول ملف فقط
            room: roomId,
            fileUrl: data.fileUrl,
            fileName: data.fileName,
            fileType: data.fileType,
          };

          socketRef.current.emit("send_message", messageData);
          captionText = "";
        }
      } catch (error) {
        console.error("Upload failed", error);
      } finally {
        setLoadingFiles(false);
        setIsSending(false);
      }

      // تنظيف
      previewUrls.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
      setSelectedFiles([]);
      setPreviewUrls([]);
      setIsPreviewOpen(false);
      setInput("");
      if (document.getElementById("file-upload")) {
        document.getElementById("file-upload").value = "";
      }
      return;
    }

    const messageData = {
      author: user.username,
      role: user.role,
      message: input,
      room: roomId,
    };

    socketRef.current.emit("send_message", messageData);
    setInput("");
  };

  const handleSelectSeller = (seller) => {
    setIsOtherTyping(false);
    setTypingUser("");
    setSelectedSeller(seller);

    const roomId = getRoom(user, seller);
    socketRef.current.emit("join_room", roomId);
    // اطلب الرسائل القديمة
    socketRef.current.emit("get_messages", roomId);
    socketRef.current.emit("mark_messages_read", roomId);
    // مسح التنبيهات الخاصة بهذا البائع من المصفوفة
    setNotifications((prev) =>
      prev.filter((n) => n.room !== `seller_${seller._id}`),
    );
  };

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.log(
          "Sound blocked by browser security. Click anywhere to enable.",
        );
      });
    }
  };
  const handleInputChange = (e) => {
    setInput(e.target.value);

    const roomId = getRoom(user, selectedSeller);
    if (!roomId) return;

    if (selectedSeller || user.role === "seller") {
      const now = Date.now();
      console.log(lastTypingTimeRef);
      if (now - lastTypingTimeRef.current > 1500) {
        socketRef.current.emit("typing", {
          room: roomId,
          username: user.username,
          isTyping: true,
        });
        lastTypingTimeRef.current = now;
      }
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current.emit("stop_typing", {
        room: roomId,
        username: user.username,
        isTyping: false,
      });
      lastTypingTimeRef.current = 0;
    }, 2000);
  };

  const deleteMessage = (messageId, room) => {
    socketRef.current.emit("delete_message", { messageId, room });
  };

  return {
    messages,
    sellers,
    selectedSeller,
    onlineUsersList,
    isOtherTyping,
    typingUser,
    notifications,
    setNotifications,
    input,
    isSending,
    loadingSellers,
    selectedFiles,
    previewUrls,
    isPreviewOpen,
    sendMessage,
    handleSelectSeller,
    deleteMessage,
    messagesEndRef,
    handleInputChange,
    handleFileChange,
    cancelPreview,
    lastSeenMap,
    loadingFiles,
  };
};

export default useChat;
