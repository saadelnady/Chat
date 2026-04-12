import { useEffect, useRef, useState } from "react";
import { getRoomId, handleLogout } from "../../helpers/helpers";
import { socket } from "../../socket";
import { getSellers } from "../../api/sellers";

export default function Chat({ user }) {
  const socketRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    socketRef.current = socket;

    socketRef.current.on("connect", () => {
      console.log("Connected to server");
      console.log("Socket ID:", socketRef.current.id);
      if (user) {
        socketRef.current.emit("join_room", user.id);
      }
    });
  }, [user]);

  useEffect(() => {
    socketRef.current.on("receive_message", (data) => {
      console.log("📩 received:", data);
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socketRef.current.off("receive_message");
    };
  }, []);

  useEffect(() => {
    if (user && user.role === "admin") {
      const fetchSellers = async () => {
        setLoading(true);
        try {
          const data = await getSellers();
          setSellers(data);
        } catch (err) {
          console.log(err);
        } finally {
          setLoading(false);
        }
      };
      fetchSellers();
    }
  }, [user]);

  const sendMessage = () => {
    if (!input.trim() || !selectedSeller) return;
    const roomId = getRoomId(user._id, selectedSeller._id);

    const messageData = {
      author: user.username,
      role: user.role,
      message: input,
      room: roomId,
    };
    console.log("📤 sending:", messageData);
    socketRef.current.emit("send_message", messageData);

    setInput("");
  };

  const handleSelectSeller = (seller) => {
    setSelectedSeller(seller);
    console.log(user._id, seller._id);

    const roomId = getRoomId(user._id, seller._id);

    socketRef.current.emit("join_room", roomId);
  };

  return (
    <div className="chat-wrapper ">
      <div className="chat">
        <div className="chat-header">
          <div className="header-info">
            <h2> Hello {user?.username}</h2>
            <p>{user?.role}</p>
            <p className="status status-offline">Online</p>
          </div>
          <div className="header-actions">
            <button className="lang-btn">Language</button>
            <button className="bell-btn">Notifications</button>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
        <div className="chat-body">
          {user?.role === "admin" && (
            <div className="sellers-sidebar">
              <h2>Sellers</h2>
              <ul>
                {loading ? (
                  <div className="text-center loading">
                    <div className="spinner"></div>
                  </div>
                ) : sellers?.length > 0 ? (
                  sellers?.map((seller) => (
                    <li key={seller._id}>
                      <button
                        onClick={() => handleSelectSeller(seller)}
                        className={
                          selectedSeller?._id === seller._id ? "active" : ""
                        }
                      >
                        <img src="/logo.png" alt="" />
                        {seller.username}
                      </button>
                    </li>
                  ))
                ) : (
                  <p className="text-center">No sellers found</p>
                )}
              </ul>
            </div>
          )}

          {/* الجزء اليمين */}
          {!selectedSeller && user?.role === "admin" ? (
            <div className="no-chat">
              <h3 className="text-center">Select a seller to start chatting</h3>
            </div>
          ) : (
            <div className="messages-container">
              <div className="messages">
                {messages.length === 0 ? (
                  <p className="text-center">No messages yet</p>
                ) : (
                  messages.map((msg, index) => (
                    <div
                      className={`message ${
                        msg.author === user.username ? "own" : ""
                      }`}
                      key={index}
                    >
                      <div className="message-header">
                        <h4>{msg.author}</h4>
                      </div>
                      <div className="message-body">
                        <p>{msg.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* input يظهر بس لما تختار seller */}
              <div className="message-input">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <button onClick={sendMessage}>Send</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
