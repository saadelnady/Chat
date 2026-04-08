import React from "react";
import NotificationsDropdown from "./NotificationsDropdown";

export default function ChatHeader({
  user,
  isConnected,
  t,
  i18n,
  toggleLanguage,
  showSidebar,
  setShowSidebar,
  showNotifications,
  setShowNotifications,
  notifications,
  clearNotifications,
  handleNotificationClick,
  handleLogout,
}) {
  return (
    <div className="chat-header-v2">
      <div className="header-info">
        <h2>
          {t("welcome", { username: user.username })}{" "}
          <span className="role-badge">
            {user.role === "admin" ? t("admin") : t("seller")}
          </span>
        </h2>
        <div className={`status-indicator ${isConnected ? "online" : "offline"}`}>
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
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"></path>
            </svg>
            <span>{t("sellers")}</span>
          </button>
        )}
        <button
          className="bell-btn"
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
          </svg>
          {notifications.length > 0 && (
            <span className="bell-badge">{notifications.length}</span>
          )}
        </button>

        <NotificationsDropdown
          notifications={notifications}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          clearNotifications={clearNotifications}
          handleNotificationClick={handleNotificationClick}
          t={t}
        />

        <button onClick={handleLogout} className="logout-btn">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M16 13v-2H7V8l-5 4 5 4v-3zM20 3h-9c-1.1 0-2 .9-2 2v4h2V5h9v14h-9v-4H9v4c0 1.1.9 2 2 2h9c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"></path>
          </svg>
          <span>{t("logout")}</span>
        </button>
      </div>
    </div>
  );
}
