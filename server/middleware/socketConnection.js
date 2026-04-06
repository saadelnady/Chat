import { io } from "../server.js";
import Message from "../models/Message.js";

const onlineUsers = new Map(); // userId → socketId

const socketConnection = () => {
  return io.on("connection", (socket) => {
    console.log("New user connected:", socket.id);

    socket.on("join_room", (room) => {
      socket.join(room);
    });

    // تسجيل اليوزر المتصل
    socket.on("user_connected", (userId) => {
      onlineUsers.set(userId, socket.id);
      io.emit("online_users", Array.from(onlineUsers.keys()));
    });

    socket.on("receive_message", (data) => {
      Message.find({ room: data.room }).then((messages) => {
        socket.emit("receive_message", messages);
      });
    });

    socket.on("send_message", async (data) => {
      const msg = new Message(data);
      await msg.save();
      
      // Broadcast to specific room
      io.to(data.room).emit("receive_message", data);

      // لو كانت رسالة موجهة لتاجر (سواء من تاجر أو أدمن)، نبعتها لغرفة تنبيهات الأدمنز المشتركة
      if (data.room.startsWith("seller_")) {
        io.to("admins_notifications").emit("receive_message", data);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      // شيل اليوزر من الـ Map وبعت القائمة المحدثة
      for (const [userId, sId] of onlineUsers) {
        if (sId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
      io.emit("online_users", Array.from(onlineUsers.keys()));
    });
  });
};

export default socketConnection;
