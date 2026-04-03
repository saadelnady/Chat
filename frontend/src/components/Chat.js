import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import useSocket from "../lib/useSocket";

const userColors = [
  "#fecaca",
  "#fde047",
  "#86efac",
  "#93c5fd",
  "#c4b5fd",
  "#fbcfe8",
  "#bef264",
  "#7dd3fc",
  "#a7f3d0",
  "#fca5a5",
];

const getColorForUser = (username) => {
  if (!username) return "#86efac";
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return userColors[Math.abs(hash) % userColors.length];
};

export default function Chat({ user }) {
  const { t, i18n } = useTranslation();

  const {
    messages,
    sellers,
    onlineSellers,
    unreadCounts,
    setUnreadCounts,
    currentRoomRef,
    socket,
  } = useSocket(user);

  const [message, setMessage] = useState("");
  const [currentRoom, setCurrentRoom] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef(null);

  // sync room ref
  useEffect(() => {
    currentRoomRef.current = currentRoom;

    if (currentRoom) {
      setUnreadCounts((prev) => ({ ...prev, [currentRoom]: 0 }));
    }
  }, [currentRoom, setUnreadCounts, currentRoomRef]);

  // scroll
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages, currentRoom]);

  // RTL
  useEffect(() => {
    document.body.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  const sendMessage = () => {
    if (!message.trim()) return;

    const room = user.role === "seller" ? user.username : currentRoom;

    if (user.role === "admin" && !room) {
      alert(t("errors.select_seller"));
      return;
    }

    if (socket) {
      socket.emit("send_message", { to: room, message });
    }
    setMessage("");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ar" : "en";
    i18n.changeLanguage(newLang);
  };

  if (!user) return <div style={{ color: "white" }}>{t("loading")}</div>;

  return (
    <div className="chat-wrapper">
      <div className="chat">
        <div className="chat-header-v2">
          <h2>
            {t("welcome", { username: user.username })}{" "}
            <span className="role-badge">
              {user.role === "admin" ? t("admin") : t("seller")}
            </span>
          </h2>
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
              <h3>{t("sellers")}</h3>
              <div className="sellers-list-items">
                {sellers.map((seller) => (
                  <button
                    key={seller}
                    onClick={() => {
                      setCurrentRoom(seller);
                      setShowSidebar(false);
                    }}
                    className={`seller-btn ${currentRoom === seller ? "active" : ""}`}
                  >
                    <div className="seller-name-container">
                      {seller}
                      {onlineSellers.includes(seller) && (
                        <span className="online-indicator"></span>
                      )}
                    </div>
                    {unreadCounts[seller] > 0 && (
                      <span className="unread-badge">
                        {unreadCounts[seller]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="main-chat-area">
            {user.role === "admin" && !currentRoom ? (
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
                  {messages
                    .filter(
                      (msg) =>
                        user.role === "seller" ||
                        (currentRoom && msg.room === currentRoom),
                    )
                    .map((m, i) => {
                      const isMe = m.author === user.username;
                      return (
                        <div
                          key={i}
                          className={`message-bubble ${isMe ? "sent" : "received"}`}
                        >
                          <div className="msg-info">
                            <span
                              className="msg-author"
                              style={{
                                color: isMe
                                  ? "rgba(255,255,255,0.9)"
                                  : getColorForUser(m.author),
                              }}
                            >
                              {isMe ? t("you") : m.author}
                            </span>
                            {user.role === "admin" && !currentRoom && (
                              <span className="room-badge">{m.room}</span>
                            )}
                          </div>
                          <div className="msg-text">{m.message}</div>
                          <div className="msg-time">{m.time}</div>
                        </div>
                      );
                    })}
                  <div ref={messagesEndRef} style={{ height: "1px" }} />
                </div>

                <form
                  className="chat-input-area"
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                >
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t("type_message")}
                  />
                  <button
                    type="submit"
                    className="send-button"
                    disabled={!message.trim()}
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
