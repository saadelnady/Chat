import React from "react";

export default function MessageItem({ msg, user, targetScrollMessageId }) {
  return (
    <div
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

      {msg.message && <div className="msg-text">{msg.message}</div>}

      <div className="msg-timestamp">
        {new Date(msg.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}
