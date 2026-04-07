import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { getSellers } from "../api/sellers";
import useSocket from "../hooks/useSocket";

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
  } = useSocket(user, selectedSeller?._id);

  const { t, i18n } = useTranslation();
  const [showSidebar, setShowSidebar] = useState(false);
  const [sellers, setSellers] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  // RTL
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
      getSellers().then((data) => setSellers(data));
    }
  }, [user]);

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

    try {
      const response = await fetch("http://localhost:3000/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const fileData = await response.json();
        sendMessage(fileData); // Send message with file info
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
        <div className="chat-header-v2">
          <div className="header-info">
            <h2>
              {t("welcome", { username: user.username })}{" "}
              <span className="role-badge">
                {user.role === "admin" ? t("admin") : t("seller")}
              </span>
            </h2>
            <div
              className={`status-indicator ${isConnected ? "online" : "offline"}`}
            >
              {isConnected ? t("online") : t("offline")}
            </div>
          </div>

          <div className="header-actions">
            <button onClick={toggleLanguage} className="lang-btn">
              {i18n.language === "en" ? "العربية" : "English"}
            </button>
            {user.role === "admin" && (
              <button
                className="toggle-sidebar-btn"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                <svg
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  fill="currentColor"
                >
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"></path>
                </svg>
                <span>{t("sellers")}</span>
              </button>
            )}
            <button
              className="bell-btn"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="currentColor"
              >
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
              </svg>
              {notifications.length > 0 && (
                <span className="bell-badge">{notifications.length}</span>
              )}
            </button>
            {showNotifications && (
              <div className="notifications-dropdown">
                <div className="notifications-header">
                  <span>{t("notifications")}</span>
                  <button
                    className="clear-notif-btn"
                    onClick={clearNotifications}
                  >
                    {t("clear_notif")}
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <p className="no-notif">{t("no_notif")}</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="notif-item"
                      onClick={() => handleNotificationClick(n)}
                      style={{ cursor: "pointer" }}
                    >
                      <span className="notif-author">{n.author}</span>
                      <span className="notif-msg">{n.message}</span>
                      <span className="notif-time">
                        {new Date(n.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
            <button onClick={handleLogout} className="logout-btn">
              <svg
                viewBox="0 0 24 24"
                width="20"
                height="20"
                fill="currentColor"
              >
                <path d="M16 13v-2H7V8l-5 4 5 4v-3zM20 3h-9c-1.1 0-2 .9-2 2v4h2V5h9v14h-9v-4H9v4c0 1.1.9 2 2 2h9c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"></path>
              </svg>
              <span>{t("logout")}</span>
            </button>
          </div>
        </div>

        <div className="chat-body">
          {user.role === "admin" && (
            <div className={`sellers-sidebar ${showSidebar ? "open" : ""}`}>
              <div className="sidebar-header">
                <h3>{t("sellers")}</h3>
                <button
                  className="close-sidebar-btn"
                  onClick={() => setShowSidebar(false)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <div className="sellers-list-items">
                {sellers.map((seller) => (
                  <button
                    key={seller?._id}
                    className={`seller-btn ${selectedSeller?._id === seller?._id ? "active" : ""}`}
                    onClick={() => handleSellerClick(seller)}
                  >
                    <span className="seller-name-container">
                      {seller.username}
                      {onlineUsers.includes(seller._id) && (
                        <span className="online-indicator"></span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
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
                <div
                  className="messages"
                  style={{ border: "none", height: "auto" }}
                >
                  {messages.map((msg, index) => (
                    <div
                      key={msg._id || index}
                      id={msg._id ? `msg-${msg._id}` : null}
                      className={`message-bubble ${msg.author === user.username ? "sent" : "received"} ${targetScrollMessageId === msg._id ? "highlighted-message" : ""}`}
                    >
                      <div className="msg-info">
                        <span className="msg-author">{msg.author}</span>
                      </div>

                      {msg.fileUrl && (
                        <div className="msg-attachment">
                          {msg.fileType === "image" ? (
                            <img
                              src={msg.fileUrl}
                              alt={msg.fileName}
                              className="chat-image"
                              onClick={() => window.open(msg.fileUrl, "_blank")}
                            />
                          ) : (
                            <a
                              href={msg.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="file-link"
                            >
                              <svg
                                viewBox="0 0 24 24"
                                width="20"
                                height="20"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                <polyline points="13 2 13 9 20 9"></polyline>
                              </svg>
                              <span>{msg.fileName}</span>
                            </a>
                          )}
                        </div>
                      )}

                      {msg.message && (
                        <div className="msg-text">{msg.message}</div>
                      )}

                      <div className="msg-timestamp">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} style={{ height: "1px" }} />
                </div>

                <div className="chat-input-wrapper">
                  {typingUser && (
                    <div className="typing-indicator">
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                      {typingUser}{" "}
                      {i18n.language === "ar" ? "يكتب الآن..." : "is typing..."}
                    </div>
                  )}

                  <form
                    className="chat-input-area"
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage();
                    }}
                  >
                    <button
                      type="button"
                      className="attach-btn"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <span className="loader"></span>
                      ) : (
                        <svg
                          viewBox="0 0 24 24"
                          width="24"
                          height="24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                        </svg>
                      )}
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />

                    <input
                      value={message}
                      onChange={handleInputChange}
                      placeholder={t("type_message")}
                    />
                    <button
                      type="submit"
                      className="send-button"
                      disabled={!message.trim() || isUploading}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="28"
                        height="28"
                        fill="none"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                      </svg>
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
