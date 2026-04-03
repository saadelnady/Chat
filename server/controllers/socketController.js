const User = require("../models/User");
const Message = require("../models/Message");

// Logic for a seller joining their own room
const handleSellerJoin = async (io, socket, username) => {
  try {
    socket.join(username);
    console.log(`socket  >>>>>  ${JSON.stringify(socket.user)}  `);
    const messages = await Message.find({ room: username });
    socket.emit("load_messages", messages);

    // Notify online admin about the sellers being online
    const adminSocket = [...io.sockets.sockets.values()].find(
      (s) => s.user?.role === "admin",
    );
    adminSocket?.emit("seller_online", { seller: username });
  } catch (error) {
    console.error("Error in handleSellerJoin:", error);
    socket.emit("error", { message: "Failed to join room and load messages" });
  }
};

// Logic for an admin joining all seller rooms
const handleAdminJoin = async (io, socket) => {
  try {
    const sellers = await User.find({ role: "seller" });
    sellers.forEach((s) => socket.join(s.username));

    socket.emit(
      "load_sellers",
      sellers.map((s) => s.username),
    );

    // 👇👇 أضف هذا الجزء هنا 👇👇
    const onlineSellers = [...io.sockets.sockets.values()]
      .filter((s) => s.user?.role === "seller")
      .map((s) => s.user.username);
    socket.emit("load_online_sellers", [...new Set(onlineSellers)]);
    // 👆👆👆👆👆👆👆👆👆👆👆👆

    const allMessages = await Message.find().sort({ time: 1 });
    socket.emit("load_messages", allMessages);
  } catch (error) {
    console.error("Error in handleAdminJoin:", error);
    socket.emit("error", { message: "Failed to load admin dashboard data" });
  }
};

// Logic for sending messages
const handleSendMessage = async (
  io,
  socket,
  username,
  role,
  { to, message },
) => {
  try {
    const msgData = {
      room: to,
      author: username,
      role,
      message,
      time: new Date().toLocaleTimeString(),
    };
    const msg = await new Message(msgData).save();
    io.to(to).emit("receive_message", msg);
  } catch (error) {
    console.error("Error in handleSendMessage:", error);
    socket.emit("error", { message: "Message could not be sent" });
  }
};

// Main socket controller
const socketController = (io, socket) => {
  const { username, role } = socket.user;
  console.log(`User connected: ${username} (${role})`);

  // Room Join
  socket.on("join_room", () => {
    if (role === "seller") return handleSellerJoin(io, socket, username);
    if (role === "admin") return handleAdminJoin(io, socket);
  });

  // Message Sending
  socket.on("send_message", (data) =>
    handleSendMessage(io, socket, username, role, data),
  );

  // Disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${username}`);

    // لو اللى خرج Seller ابعت إنه Offline
    if (role === "seller") {
      const adminSocket = [...io.sockets.sockets.values()].find(
        (s) => s.user?.role === "admin",
      );

      adminSocket?.emit("seller_offline", { seller: username });
    }
  });
};

module.exports = socketController;
