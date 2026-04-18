import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { handleLogout } from "../../helpers/helpers";
import useChat from "../../hooks/useChat";
// import { getSellers } from "../../api/sellers";

export default function Chat({ user }) {
  const { t, i18n } = useTranslation();
  const {
    messages,
    sellers,
    selectedSeller,
    onlineUsersList,
    isOtherTyping,
    typingUser,
    notifications,
    input,
    isSending,
    loadingSellers,
    selectedFiles,
    previewUrls,
    isPreviewOpen,
    deleteMessage,
    sendMessage,
    handleSelectSeller,
    handleInputChange,
    messagesEndRef,
    handleFileChange,
    cancelPreview,
    lastSeenMap,
    setNotifications,
    loadingFiles,
  } = useChat(user);
  const [activeSideBar, setActiveSideBar] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageActions, setMessageActions] = useState(null); // null أو messageId
  const notifRef = useRef(null);
  const messageActionsRef = useRef(null);

  const filteredSellers =
    sellers &&
    sellers.length > 0 &&
    searchQuery &&
    searchQuery.trim().length > 0
      ? sellers.filter((seller) =>
          seller.username.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : sellers;

  const handleSideBar = () => {
    setActiveSideBar(!activeSideBar);
  };

  useEffect(() => {
    document.body.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  const toggleLanguage = () => {
    const nextLng = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(nextLng);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleMessageActionsClickOutside = (event) => {
      if (
        messageActionsRef.current &&
        !messageActionsRef.current.contains(event.target)
      ) {
        setMessageActions(false);
      }
    };

    document.addEventListener("mousedown", handleMessageActionsClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleMessageActionsClickOutside,
      );
    };
  }, []);

  /* تجميع التنبيهات */
  const uniqueNotifications = [];

  // 1. تنبيهات الرسائل
  const messageNotifs = notifications.filter((n) => n.room);
  Array.from(new Set(messageNotifs.map((n) => n.room))).forEach((room) => {
    const lastMsg = [...messageNotifs].reverse().find((n) => n.room === room);
    const sellerId = room.replace("seller_", "");
    const seller = sellers.find((s) => s._id === sellerId);
    if (seller) {
      uniqueNotifications.push({
        type: "message",
        room,
        seller,
        lastMessage: lastMsg?.message || "Sent an attachment",
        count: messageNotifs.filter((n) => n.room === room).length,
      });
    }
  });

  // 2. تنبيهات البائعين الجدد
  const newUserNotifs = notifications.filter((n) => n.type === "new_seller");
  newUserNotifs.forEach((n) => {
    uniqueNotifications.push({
      _id: n._id, // نحتاجه للحذف
      type: "new_seller",
      seller: n.seller,
      lastMessage: "🎉 New seller joined!",
      count: 1,
    });
  });
  const getLastSeen = (sellerId) => {
    if (onlineUsersList.includes(sellerId)) return null; // متصل حالياً
    const lastSeen = lastSeenMap[sellerId];
    if (!lastSeen) return null;

    const diff = Math.floor((Date.now() - new Date(lastSeen)) / 60000);
    if (diff < 1) return "Active just now";
    if (diff < 60) return `Active ${diff}m ago`;
    if (diff < 1440) return `Active ${Math.floor(diff / 60)}h ago`;
    return null;
  };

  return (
    <div className="chat-wrapper ">
      <div className="chat">
        <div className="chat-header">
          <div className="header-info">
            <h2>
              {t("welcome", {
                username: user?.username,
              })}
            </h2>
            <p>{t(user?.role)}</p>
            <p
              className={`status ${onlineUsersList.includes(user?._id) ? "status-online" : "status-offline"}`}
            >
              {onlineUsersList.includes(user?._id) ? t("online") : t("offline")}
            </p>
          </div>
          <div className="header-actions">
            <button className="lang-btn" onClick={toggleLanguage}>
              {i18n.language === "en" ? "العربية" : "English"}
            </button>
            {user?.role === "admin" && (
              <button className="toggle-sidebar-btn" onClick={handleSideBar}>
                ☰
              </button>
            )}
            <div className="notifications-wrapper">
              <button
                className="bell-btn"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              >
                🔔
                {notifications.length > 0 && (
                  <span className="bell-badge">{notifications.length}</span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="notifications-dropdown" ref={notifRef}>
                  <h4>{t("notifications")}</h4>
                  {uniqueNotifications.length === 0 ? (
                    <p className="no-notif">{t("no_notif")}</p>
                  ) : (
                    <ul>
                      {uniqueNotifications.map((notif, idx) => (
                        <li key={idx}>
                          <div
                            className="notif-item"
                            onClick={() => {
                              handleSelectSeller(notif.seller);
                              setIsNotificationsOpen(false);
                              if (notif.type === "new_seller") {
                                // لحذف اشعار "بائع جديد" عند الضغط عليه
                                setNotifications((prev) =>
                                  prev.filter((n) => n._id !== notif._id),
                                );
                              }
                            }}
                          >
                            <strong>{notif.seller?.username}</strong>
                            <p>{notif.lastMessage?.substring(0, 20)}...</p>
                            <span className="notif-count">{notif.count}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <button className="logout-btn" onClick={handleLogout}>
              {/* logouticon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 12l-3 3m0 0 3 3m-3-3h11.25"
                />
              </svg>

              <span>{t("logout")}</span>
            </button>
          </div>
        </div>
        <div className="chat-body">
          {user?.role === "admin" && (
            <div className={`sellers-sidebar ${activeSideBar ? "active" : ""}`}>
              <div className="sidebar-header">
                <h2>{t("sellers")}</h2>
                <button onClick={handleSideBar} className="close-btn">
                  ❌
                </button>
              </div>
              <input
                type="text"
                className="search-input"
                placeholder="Search sellers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <ul>
                {loadingSellers ? (
                  <div className="text-center loading">
                    <div className="spinner"></div>
                  </div>
                ) : filteredSellers?.length > 0 ? (
                  filteredSellers?.map((seller) => {
                    const sellerNotifications = notifications.filter(
                      (n) => n.room === `seller_${seller._id}`,
                    ).length;
                    return (
                      <li key={seller._id}>
                        <button
                          onClick={() => {
                            handleSelectSeller(seller);
                            handleSideBar();
                          }}
                          className={` ${selectedSeller?._id === seller._id ? "active" : ""}`}
                        >
                          <img src="/logo.png" alt="" />
                          {seller.username}

                          <span
                            className={`status-dot ${onlineUsersList.includes(seller._id) ? "online" : "offline"}`}
                          ></span>
                          {sellerNotifications > 0 && (
                            <span className="notification-dot">
                              {sellerNotifications}
                            </span>
                          )}
                          {getLastSeen(seller._id) && (
                            <small className="last-seen">
                              {getLastSeen(seller._id)}
                            </small>
                          )}
                        </button>
                      </li>
                    );
                  })
                ) : (
                  <p className="no-sellers">No sellers found</p>
                )}
              </ul>
            </div>
          )}

          {/* الجزء اليمين */}
          {!selectedSeller && user?.role === "admin" ? (
            <div className="no-chat">
              <h3 className="text-center">{t("choose_conversation")}</h3>
              <p className="text-center">{t("select_seller_msg")}</p>
            </div>
          ) : (
            <div className="messages-container">
              <div className="messages">
                {messages.length === 0 ? (
                  <p className="no_messages">{t("no_messages")}</p>
                ) : (
                  messages.map((msg, index) => {
                    console.log(msg);
                    return (
                      <div
                        className={`message ${
                          msg.author === user.username ? "own" : ""
                        }`}
                        key={index}
                      >
                        {" "}
                        <div className="message-header">
                          <h4>{msg.author}</h4>
                          <div className="message-header-actions">
                            <button
                              onClick={() =>
                                setMessageActions(
                                  messageActions === msg._id ? null : msg._id,
                                )
                              }
                              className="message-actions-btn"
                            >
                              ...
                            </button>
                            <div
                              className="message-actions"
                              ref={messageActionsRef}
                            >
                              {msg.author === user.username &&
                                messageActions === msg._id && (
                                  <button
                                    className="delete-msg-btn"
                                    onClick={() => {
                                      deleteMessage(msg._id, msg.room);
                                      setMessageActions(null);
                                    }}
                                  >
                                    🗑️ Delete
                                  </button>
                                )}
                            </div>
                          </div>
                        </div>
                        <div className="message-body">
                          {msg.fileUrl && msg.fileType === "image" && (
                            <div className="message-image">
                              <img
                                src={msg.fileUrl}
                                alt="attachment"
                                loading="lazy"
                                onLoad={() =>
                                  messagesEndRef.current?.scrollIntoView({
                                    behavior: "smooth",
                                  })
                                }
                              />
                            </div>
                          )}
                          {msg.fileUrl && msg.fileType === "file" && (
                            <div className="message-file">
                              <a
                                href={msg.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                📄 {msg.fileName || "Download File"}
                              </a>
                            </div>
                          )}
                          {msg.message && <p>{msg.message}</p>}
                        </div>
                        {msg.author === user.username && (
                          <div className="message-footer">
                            <div
                              className={`checkmark ${msg.read ? "read" : ""}`}
                            >
                              {msg.read ? " ✓✓" : " ✓"}
                            </div>
                            <div>
                              <p>
                                {new Date(msg.timestamp).toDateString() +
                                  " " +
                                  new Date(msg.timestamp).getHours() +
                                  ":" +
                                  new Date(msg.timestamp).getMinutes()}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                <div ref={messagesEndRef} />
              </div>

              {isOtherTyping && (
                <div className="typing-indicator">
                  <small>
                    {typingUser} {t("typing")}
                  </small>
                </div>
              )}

              <div className="message-input">
                <input
                  type="text"
                  placeholder={t("type_message")}
                  value={input}
                  onChange={(e) => handleInputChange(e)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendMessage();
                  }}
                />
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept="image/*,.pdf,.txt"
                  onChange={(e) => handleFileChange(e.target.files)}
                />
                <label htmlFor="file-upload" className="file-upload">
                  📎
                </label>

                <button onClick={sendMessage} disabled={isSending}>
                  {isSending ? "⏳" : t("send")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="modal-overlay" onClick={cancelPreview}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <h3>🖼️ Preview</h3>
            <div className="preview-gallery">
              {previewUrls.map((url, idx) => (
                <div className="preview-item" key={idx}>
                  {url ? (
                    <img src={url} alt={`preview-${idx}`} />
                  ) : (
                    <div className="file-placeholder">
                      <span>📄</span>
                      <p>{selectedFiles[idx]?.name}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="preview-actions">
              <button className="preview-cancel" onClick={cancelPreview}>
                ✖ Cancel
              </button>
              <button
                className="preview-send"
                onClick={sendMessage}
                disabled={loadingFiles}
              >
                {loadingFiles ? "⏳ Uploading..." : "✔ Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
