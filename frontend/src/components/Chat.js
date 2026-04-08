import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { getSellers } from "../api/sellers";
import useSocket from "../hooks/useSocket";

// Sub-components
import ChatHeader from "./chat/ChatHeader";
import SellersSidebar from "./chat/SellersSidebar";
import MessageList from "./chat/MessageList";
import ChatInput from "./chat/ChatInput";

export default function Chat({ user }) {
  const [selectedSeller, setSelectedSeller] = useState(null);
  const {
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
  } = useSocket(user, selectedSeller?._id);

  const { t, i18n } = useTranslation();
  const [showSidebar, setShowSidebar] = useState(false);
  const [sellers, setSellers] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  // RTL handling
  useEffect(() => {
    document.body.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLang);
  };

  useEffect(() => {
    if (user && user.role === "admin") {
      getSellers()
        .then((data) => setSellers(data))
        .catch((err) => console.log(err));
    }
  }, [user, selectedSeller]);

  const handleSellerClick = (seller) => {
    setSelectedSeller(seller);
    clearNotifications();
    setShowNotifications(false);
    setTargetScrollMessageId(null);
  };

  const handleNotificationClick = (n) => {
    if (user.role === "admin") {
      const sellerId = n.room.includes("_") ? n.room.split("_")[1] : n.room;
      const targetSeller = sellers.find((s) => s._id === sellerId);

      if (targetSeller) {
        setSelectedSeller(targetSeller);
        setShowSidebar(false);
      }
    }

    setTargetScrollMessageId(n.id);
    setShowNotifications(false);
    markAsRead(n.id);
    removeNotification(n.id);
  };

  useEffect(() => {
    if (targetScrollMessageId) {
      const element = document.getElementById(`msg-${targetScrollMessageId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        const timer = setTimeout(() => {
          setTargetScrollMessageId(null);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [messages, targetScrollMessageId, setTargetScrollMessageId]);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    sendTypingStatus(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, 2000);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const fileData = await response.json();
        sendMessage(fileData);
      } else {
        alert("فشل في رفع الملف");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("حدث خطأ أثناء الرفع");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (!user) return <div style={{ color: "white" }}>{t("loading")}</div>;

  return (
    <div className="chat-wrapper">
      {!isConnected && (
        <div className="connection-toast">
          <span className="spinner"></span>
          {t("reconnecting") || "جاري إعادة الاتصال..."}
        </div>
      )}

      <div className="chat">
        <ChatHeader
          user={user}
          isConnected={isConnected}
          t={t}
          i18n={i18n}
          toggleLanguage={toggleLanguage}
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          notifications={notifications}
          clearNotifications={clearNotifications}
          handleNotificationClick={handleNotificationClick}
          handleLogout={handleLogout}
        />

        <div className="chat-body">
          {user.role === "admin" && (
            <SellersSidebar
              showSidebar={showSidebar}
              setShowSidebar={setShowSidebar}
              sellers={sellers}
              selectedSeller={selectedSeller}
              handleSellerClick={handleSellerClick}
              onlineUsers={onlineUsers}
              t={t}
            />
          )}

          <div className="main-chat-area">
            {user.role === "admin" && !selectedSeller ? (
              <div className="no-room-container">
                <div className="no-room-content">
                  <div className="no-room-icon">💬</div>
                  <h2>{t("choose_conversation")}</h2>
                  <p>{t("select_seller_msg")}</p>
                </div>
              </div>
            ) : (
              <>
                <MessageList
                  messages={messages}
                  user={user}
                  targetScrollMessageId={targetScrollMessageId}
                  messagesEndRef={messagesEndRef}
                />

                <ChatInput
                  typingUser={typingUser}
                  i18n={i18n}
                  message={message}
                  handleInputChange={handleInputChange}
                  sendMessage={sendMessage}
                  fileInputRef={fileInputRef}
                  handleFileChange={handleFileChange}
                  isUploading={isUploading}
                  t={t}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
