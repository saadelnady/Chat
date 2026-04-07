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
      console.log(`[Server] Message from ${data.author} to room ${data.room}`);
      
      const msg = new Message(data);
      await msg.save(); // بنسيف الرسالة عشان ناخد الـ _id الحقيقي
      
      // بنبعت النسخة اللي اتسيفت (عشان تتضمن الـ _id) للكل
      // Broadcast to specific room
      io.to(data.room).emit("receive_message", msg);

      // تنبيه الأدمن لو الرسالة في غرفة شات
      if (data.room.startsWith("seller_")) {
        console.log(`[Server] Notifying admins room about message in ${data.room}`);
        io.to("admins_notifications").emit("new_notification", msg);
      }
    });

    // أحداث الكتابة
    socket.on("typing", (data) => {
      socket.to(data.room).emit("user_typing", {
        username: data.username,
        isTyping: true,
      });
    });

    socket.on("stop_typing", (data) => {
      socket.to(data.room).emit("user_typing", {
        username: data.username,
        isTyping: false,
      });
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
