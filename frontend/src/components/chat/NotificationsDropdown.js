import React from "react";

export default function NotificationsDropdown({
  notifications,
  showNotifications,
  setShowNotifications,
  clearNotifications,
  handleNotificationClick,
  t,
}) {
  if (!showNotifications) return null;

  return (
    <div className="notifications-dropdown">
      <div className="notifications-header">
        <span>{t("notifications")}</span>
        <button className="clear-notif-btn" onClick={clearNotifications}>
          {t("clear_notif")}
        </button>
      </div>
      <div className="notifications-list">
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
    </div>
  );
}
