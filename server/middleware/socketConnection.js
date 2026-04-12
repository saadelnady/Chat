import { io } from "../server.js";
import Message from "../models/Message.js";

const onlineUsers = new Map(); // userId → socketId

const socketConnection = () => {
  return io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    socket.on("join_room", (room) => {
      // room   >> is a seller id that when admin send message to this seller or open messages of this seller
      socket.join(room);
    });

    socket.on("send_message", sendMessage);

    socket.on("receive_message", () => {
      console.log("data >>> ", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};

export default socketConnection;

const sendMessage = async (data) => {
  try {
    const { room, author, message, role, fileUrl, fileName, fileType } = data;
    const newMessage = new Message({
      room,
      author,
      message,
      role,
      fileUrl,
      fileName,
      fileType,
    });
    // save message in database
    await newMessage.save();
    // send message to room
    console.log("newMessage >>> ", newMessage);

    io.to(room).emit("receive_message", newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
  }
};
