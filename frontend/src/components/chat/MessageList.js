import React from "react";
import MessageItem from "./MessageItem";

export default function MessageList({
  messages,
  user,
  targetScrollMessageId,
  messagesEndRef,
}) {
  return (
    <div className="messages" style={{ border: "none", height: "auto" }}>
      {messages.map((msg, index) => (
        <MessageItem
          key={msg._id || index}
          msg={msg}
          user={user}
          targetScrollMessageId={targetScrollMessageId}
        />
      ))}
      <div ref={messagesEndRef} style={{ height: "1px" }} />
    </div>
  );
}
